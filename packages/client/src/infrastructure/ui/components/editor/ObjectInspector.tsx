/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import { isInspectable, type IInspectable, type InspectableProperty } from '@client/domain/scene/IInspectable';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { DraggablePanel } from '../common/DraggablePanel';
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
        <div class="inspector-empty">
          <span class="empty-icon">👁️</span>
          <p>{t('editor.objectInspector.noSelection')}</p>
          <small>{t('editor.objectInspector.selectFromHierarchy')}</small>
        </div>
      </DraggablePanel>
    );
  }

  const inspectable = isInspectable(selectedObject) ? (selectedObject as IInspectable) : null;
  const typeName = inspectable?.getTypeName?.() || 'Object';

  const handleTransformChange = (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => {
    if (!transform) return;
    transform[property][axis] = value;
    forceUpdate(prev => prev + 1);
  };

  const handlePropertyChange = (name: string, value: any) => {
    if (!inspectable || !selectedObject) return;
    inspectable.setProperty(name, value);
    
    // Special handling for camera target
    if (name === 'targetObjectId' && value !== 'manual' && typeName === 'Camera') {
      editor.updateCameraTarget(selectedObject.id, value);
    }
    
    // Refresh properties
    setProperties(inspectable.getInspectableProperties());
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
      <div class="inspector-content">
        {/* Object ID */}
        <div class="inspector-section">
          <div class="section-title">Object</div>
          <div class="property-row">
            <span class="property-label">ID</span>
            <span class="property-value-readonly">{selectedObject.id}</span>
          </div>
        </div>

        {/* Transform */}
        {transform && (
          <div class="inspector-section">
            <div class="section-title">{t('editor.objectInspector.transform')}</div>
            
            <div class="transform-group">
              <span class="transform-label">{t('editor.objectInspector.position')}</span>
              <div class="vector3-compact">
                <div class="vector-input-group">
                  <label>X</label>
                  <input
                    type="number"
                    value={transform.position.x.toFixed(2)}
                    onChange={(e) => handleTransformChange('position', 'x', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Y</label>
                  <input
                    type="number"
                    value={transform.position.y.toFixed(2)}
                    onChange={(e) => handleTransformChange('position', 'y', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Z</label>
                  <input
                    type="number"
                    value={transform.position.z.toFixed(2)}
                    onChange={(e) => handleTransformChange('position', 'z', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                  />
                </div>
              </div>
            </div>

            <div class="transform-group">
              <span class="transform-label">{t('editor.objectInspector.rotation')}</span>
              <div class="vector3-compact">
                <div class="vector-input-group">
                  <label>X</label>
                  <input
                    type="number"
                    value={(transform.rotation.x * 180 / Math.PI).toFixed(0)}
                    onChange={(e) => handleTransformChange('rotation', 'x', parseFloat((e.target as HTMLInputElement).value) * Math.PI / 180)}
                    step="1"
                    class="vector-input-compact"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Y</label>
                  <input
                    type="number"
                    value={(transform.rotation.y * 180 / Math.PI).toFixed(0)}
                    onChange={(e) => handleTransformChange('rotation', 'y', parseFloat((e.target as HTMLInputElement).value) * Math.PI / 180)}
                    step="1"
                    class="vector-input-compact"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Z</label>
                  <input
                    type="number"
                    value={(transform.rotation.z * 180 / Math.PI).toFixed(0)}
                    onChange={(e) => handleTransformChange('rotation', 'z', parseFloat((e.target as HTMLInputElement).value) * Math.PI / 180)}
                    step="1"
                    class="vector-input-compact"
                  />
                </div>
              </div>
            </div>

            <div class="transform-group">
              <span class="transform-label">{t('editor.objectInspector.scale')}</span>
              <div class="vector3-compact">
                <div class="vector-input-group">
                  <label>X</label>
                  <input
                    type="number"
                    value={transform.scale.x.toFixed(2)}
                    onChange={(e) => handleTransformChange('scale', 'x', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                    min="0.01"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Y</label>
                  <input
                    type="number"
                    value={transform.scale.y.toFixed(2)}
                    onChange={(e) => handleTransformChange('scale', 'y', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                    min="0.01"
                  />
                </div>
                <div class="vector-input-group">
                  <label>Z</label>
                  <input
                    type="number"
                    value={transform.scale.z.toFixed(2)}
                    onChange={(e) => handleTransformChange('scale', 'z', parseFloat((e.target as HTMLInputElement).value))}
                    step="0.1"
                    class="vector-input-compact"
                    min="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Properties */}
        {inspectable && properties.length > 0 && (
          <div class="inspector-section">
            <div class="section-title">{t('editor.objectInspector.properties')}</div>
            {properties.map(prop => (
              <PropertyControl
                key={prop.name}
                property={prop}
                onChange={(value) => handlePropertyChange(prop.name, value)}
                editor={editor}
              />
            ))}
          </div>
        )}

        {/* Not inspectable message */}
        {!inspectable && (
          <div class="inspector-section">
            <div class="not-inspectable">
              <p>⚠️ This object is not inspectable</p>
              <small>The object doesn't implement IInspectable interface</small>
            </div>
          </div>
        )}
      </div>
    </DraggablePanel>
  );
}

interface PropertyControlProps {
  property: InspectableProperty;
  onChange: (value: any) => void;
  editor?: SceneEditor;
}

function PropertyControl({ property, onChange, editor }: PropertyControlProps) {
  const { t } = useI18n();
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    
    if (property.type === 'boolean') {
      onChange((target as HTMLInputElement).checked);
    } else if (property.type === 'number') {
      onChange(parseFloat(target.value));
    } else {
      onChange(target.value);
    }
  };

  // Special handling for targetObjectId - show object selector
  if (property.name === 'targetObjectId' && editor) {
    const objects = editor.listObjects().filter(obj => obj.typeName !== 'Camera');
    return (
      <div class="property-row">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <select value={property.value} onChange={handleChange} class="property-select">
          <option value="manual">{t('editor.camera.manualPosition')}</option>
          {objects.map(obj => (
            <option key={obj.id} value={obj.id}>
              {obj.typeName} - {obj.id}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div class="property-row">
      <label class="property-label" title={property.description}>
        {property.label}
      </label>
      
      {property.readonly ? (
        <span class="property-value-readonly">{String(property.value)}</span>
      ) : property.type === 'boolean' ? (
        <input
          type="checkbox"
          checked={property.value}
          onChange={handleChange}
          class="property-checkbox"
        />
      ) : property.type === 'number' ? (
        <div class="number-control">
          <input
            type="range"
            value={property.value}
            onChange={handleChange}
            min={property.min ?? 0}
            max={property.max ?? 100}
            step={property.step || 0.1}
            class="property-slider"
          />
          <input
            type="number"
            value={property.value}
            onChange={handleChange}
            min={property.min}
            max={property.max}
            step={property.step || 0.1}
            class="property-number-display"
          />
        </div>
      ) : property.type === 'select' ? (
        <select value={property.value} onChange={handleChange} class="property-select">
          {property.options?.map(opt => {
            // Translate camera mode options
            let label = opt.label;
            if (property.name === 'mode') {
              if (opt.value === 'orbit') label = t('editor.camera.modes.orbit');
              if (opt.value === 'fixed') label = t('editor.camera.modes.fixed');
            }
            return (
              <option key={opt.value} value={opt.value}>{label}</option>
            );
          })}
        </select>
      ) : property.type === 'color' ? (
        <input
          type="color"
          value={`#${property.value.toString(16).padStart(6, '0')}`}
          onChange={(e) => onChange(parseInt((e.target as HTMLInputElement).value.slice(1), 16))}
          class="property-color"
        />
      ) : (
        <input
          type="text"
          value={property.value}
          onChange={handleChange}
          class="property-input"
        />
      )}
    </div>
  );
}

export default ObjectInspector;
