/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IComponentManager } from '@client/domain/scene/IComponentManager';
import { isInspectable, type IInspectable, type InspectableProperty } from '@client/domain/scene/IInspectable';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { DraggablePanel } from '../common/DraggablePanel';
import { EmptyInspectorView } from './inspector/EmptyInspectorView';
import { InspectorContent } from './inspector/InspectorContent';
import * as THREE from 'three';
import './object-inspector.css';

export interface ObjectInspectorProps {
  editor: SceneEditor;
}

/**
 * Object Inspector Panel
 * 
 * Displays and allows editing of properties for the selected object.
 * Shows transform (position, rotation, scale) and custom properties.
 * 
 * Features:
 * - Real-time property editing
 * - Transform controls (position, rotation, scale)
 * - Custom property controls based on type
 * - Type-specific UI widgets (sliders, color pickers, etc.)
 */
export function ObjectInspector({ editor }: ObjectInspectorProps) {
  const { t } = useI18n();
  const [selectedObject, setSelectedObject] = useState<ISceneObject | null>(null);
  const [properties, setProperties] = useState<InspectableProperty[]>([]);
  const [transform, setTransform] = useState<THREE.Object3D | null>(null);
  const [, forceUpdate] = useState(0);

  // Refresh when selection changes
  useEffect(() => {
    const unsubscribe = editor.onSelectionChange((objectId) => {
      const obj = objectId ? editor.getObject(objectId) : null;
      setSelectedObject(obj);

      if (obj && isInspectable(obj)) {
        const inspectable = obj as IInspectable;
        setProperties(inspectable.getInspectableProperties());
        setTransform(inspectable.getTransform());
      } else {
        setProperties([]);
        setTransform(null);
      }
    });

    return unsubscribe;
  }, [editor]);

  if (!selectedObject) {
    return (
      <DraggablePanel
        title={t('editor.objectInspector.title')}
        theme="pink"
        collapsible={true}
        resizable={true}
        draggable={true}
        defaultPosition={{ x: window.innerWidth - 320, y: 80 }}
        defaultSize={{ width: 300, height: 500 }}
        minWidth={250}
        minHeight={150}
      >
        <EmptyInspectorView />
      </DraggablePanel>
    );
  }

  const inspectable = isInspectable(selectedObject) ? (selectedObject as IInspectable) : null;
  const isComponentManager = 'getManagedComponents' in selectedObject;
  const componentManager = isComponentManager ? (selectedObject as unknown as IComponentManager) : null;
  const typeName = inspectable?.getTypeName?.() || 'Object';

  const handleTransformChange = (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => {
    if (!transform) return;
    transform[property][axis] = value;
    forceUpdate(prev => prev + 1);
  };

  const handlePropertyChange = (name: string, value: any) => {
    if (!inspectable || !selectedObject) return;
    
    // Special handling for orbit target object selection
    if (name === 'orbit.target' && value !== 'manual') {
      // Get target object
      const targetObj = editor.getObject(value);
      if (targetObj) {
        // Try to get transform from the object
        let position: THREE.Vector3 | null = null;
        
        // Check if object has getTransform method (VisualBody, CameraBody, etc.)
        if ('getTransform' in targetObj && typeof (targetObj as any).getTransform === 'function') {
          const transform = (targetObj as any).getTransform();
          if (transform && transform.position) {
            position = transform.position;
          }
        }
        
        // If we got a position, update the target coordinates
        if (position) {
          inspectable.setProperty('orbit.targetX', position.x);
          inspectable.setProperty('orbit.targetY', position.y);
          inspectable.setProperty('orbit.targetZ', position.z);
        }
      }
    }
    
    // Special handling for camera target (legacy)
    if (name === 'targetObjectId' && value !== 'manual' && typeName.includes('Camera')) {
      editor.updateCameraTarget(selectedObject.id, value);
    }
    
    inspectable.setProperty(name, value);
    
    // Refresh properties
    setProperties(inspectable.getInspectableProperties());
    forceUpdate(prev => prev + 1);
  };

  const handleComponentToggle = (instanceId: string) => {
    if (!componentManager) return;
    const comp = componentManager.getComponentByInstanceId(instanceId);
    if (!comp) return;
    
    if (comp.enabled) {
      componentManager.disableComponent(instanceId);
    } else {
      componentManager.enableComponent(instanceId);
    }
    
    forceUpdate(prev => prev + 1);
  };

  const handleComponentRemove = (instanceId: string) => {
    if (!componentManager) return;
    if (confirm(t('editor.components.remove.confirm'))) {
      componentManager.removeComponentByInstanceId(instanceId);
      forceUpdate(prev => prev + 1);
    }
  };

  const handleComponentPropertyChange = (instanceId: string, propName: string, value: any) => {
    if (!componentManager) return;
    const comp = componentManager.getComponentByInstanceId(instanceId);
    if (!comp || !comp.component) return;
    
    const component = comp.component as any;
    if ('setProperty' in component) {
      // Special handling for orbit.target object selection
      if (propName === 'orbit.target' && value !== 'manual') {
        const targetObj = editor.getObject(value);
        if (targetObj && 'getTransform' in targetObj) {
          const transform = (targetObj as any).getTransform();
          if (transform) {
            // Set initial position coordinates
            component.setProperty('orbit.targetX', transform.position.x);
            component.setProperty('orbit.targetY', transform.position.y);
            component.setProperty('orbit.targetZ', transform.position.z);
            // Store reference to transform for dynamic updates
            if ('setTargetTransform' in component) {
              component.setTargetTransform(transform);
            }
          }
        }
      }
      
      // Special handling for tracking.targetObjectId
      if (propName === 'tracking.targetObjectId' && value !== 'none') {
        const targetObj = editor.getObject(value);
        if (targetObj && 'getTransform' in targetObj) {
          const transform = (targetObj as any).getTransform();
          if (transform && 'setTargetTransform' in component) {
            // Set reference for TargetTrackingComponent to track moving object
            component.setTargetTransform(transform);
          }
        }
      }
      
      component.setProperty(propName, value);
      forceUpdate(prev => prev + 1);
    }
  };

  const handleAddComponent = (
    componentFactory: () => any,
    metadata: { displayName: string; category: string; icon: string; description: string }
  ) => {
    if (!componentManager) return;
    
    const newComponent = componentFactory();
    componentManager.addManagedComponent(newComponent, metadata);
    forceUpdate(prev => prev + 1);
  };

  return (
    <DraggablePanel
      title={`${t('editor.objectInspector.title')} - ${typeName}`}
      theme="pink"
      collapsible={true}
      resizable={true}
      draggable={true}
      defaultPosition={{ x: window.innerWidth - 320, y: 80 }}
      defaultSize={{ width: 300, height: 500 }}
      minWidth={250}
      minHeight={150}
    >
      <InspectorContent
        selectedObject={selectedObject}
        inspectable={inspectable}
        componentManager={componentManager}
        transform={transform}
        properties={properties}
        typeName={typeName}
        onTransformChange={handleTransformChange}
        onPropertyChange={handlePropertyChange}
        onComponentToggle={handleComponentToggle}
        onComponentRemove={handleComponentRemove}
        onComponentPropertyChange={handleComponentPropertyChange}
        onAddComponent={handleAddComponent}
        editor={editor}
      />
    </DraggablePanel>
  );
}

export default ObjectInspector;
