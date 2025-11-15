/** @jsxImportSource preact */
import { h } from 'preact';
import { ObjectInfoSection } from './ObjectInfoSection';
import { TransformSection } from './TransformSection';
import { ComponentManagerSection } from './ComponentManagerSection';
import { PropertiesSection } from './PropertiesSection';
import { NotInspectableView } from './NotInspectableView';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import type { IComponentManager } from '@client/domain/scene/IComponentManager';
import type * as THREE from 'three';
import './inspector-content.css';

export interface InspectorContentProps {
  selectedObject: ISceneObject;
  inspectable: IInspectable | null;
  componentManager: IComponentManager | null;
  transform: THREE.Object3D | null;
  properties: InspectableProperty[];
  typeName: string;
  onTransformChange: (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => void;
  onPropertyChange: (name: string, value: any) => void;
  onComponentToggle: (instanceId: string) => void;
  onComponentRemove: (instanceId: string) => void;
  onComponentPropertyChange: (instanceId: string, propName: string, value: any) => void;
  onAddComponent: (factory: () => any, metadata: any) => void;
  editor: SceneEditor;
}

/**
 * Main content router for inspector
 * 
 * Displays appropriate sections based on object capabilities:
 * - Object info (always)
 * - Transform (if has transform)
 * - Component manager (if implements IComponentManager)
 * - Properties (if inspectable and no component manager)
 * - Not inspectable warning (if not inspectable)
 */
export function InspectorContent({
  selectedObject,
  inspectable,
  componentManager,
  transform,
  properties,
  typeName,
  onTransformChange,
  onPropertyChange,
  onComponentToggle,
  onComponentRemove,
  onComponentPropertyChange,
  onAddComponent,
  editor
}: InspectorContentProps) {
  
  return (
    <div class="inspector-content">
      {/* Object Info Section - Always shown */}
      <div class="inspector-section">
        <ObjectInfoSection
          objectId={selectedObject.id}
          objectType={typeName}
        />
      </div>

      {/* Transform Section - Shown if object has transform */}
      {transform && (
        <div class="inspector-section">
          <TransformSection
            transform={transform}
            onChange={onTransformChange}
            transformProperties={inspectable?.getTransformProperties?.()}
          />
        </div>
      )}

      {/* Component Manager Section - Shown if object implements IComponentManager */}
      {componentManager && (
        <div class="inspector-section">
          <ComponentManagerSection
            componentManager={componentManager}
            onToggle={onComponentToggle}
            onRemove={onComponentRemove}
            onPropertyChange={onComponentPropertyChange}
            onAdd={onAddComponent}
            editor={editor}
          />
        </div>
      )}

      {/* Properties Section - Shown for inspectable objects without component manager */}
      {inspectable && !componentManager && properties.length > 0 && (
        <div class="inspector-section">
          <PropertiesSection
            properties={properties}
            onChange={onPropertyChange}
            editor={editor}
          />
        </div>
      )}

      {/* Not Inspectable Warning - Shown if object is not inspectable */}
      {!inspectable && (
        <div class="inspector-section">
          <NotInspectableView />
        </div>
      )}
    </div>
  );
}
