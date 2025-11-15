/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { useServices } from '@client/infrastructure/ui/hooks/useServices';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { PropertyInput } from '../../common/PropertyInput';
import { PropertyCheckbox } from '../../common/PropertyCheckbox';
import { PropertyNumber } from '../../common/PropertyNumber';
import { PropertyColor } from '../../common/PropertyColor';
import { PropertyReadonly } from '../../common/PropertyReadonly';
import { PropertySelect } from './PropertySelect';
import { ObjectTargetSelector } from './ObjectTargetSelector';
import './property-control.css';

export interface PropertyControlProps {
  property: InspectableProperty;
  onChange: (value: any) => void;
  editor?: SceneEditor; // Optional, will use context if not provided
}

/**
 * Property control router/dispatcher
 * 
 * Renders appropriate input component based on property type
 */
export function PropertyControl({ property, onChange, editor: editorProp }: PropertyControlProps) {
  const { t } = useI18n();
  const services = useServices();
  
  // Use prop editor if provided, otherwise use context
  const editor = editorProp || services.sceneEditor;
  
  // Special case: camera/orbit target object selector
  if ((property.name === 'targetObjectId' || property.name === 'tracking.targetObjectId' || property.name === 'orbit.target') && editor) {
    const allowedTypes = new Set(['Planet', 'Star', 'Black Hole']);
    const objects = editor
      .listObjects()
      .filter(obj => !obj.typeName.includes('Camera'))
      .filter(obj => allowedTypes.has(obj.typeName));
    
    return (
      <div class="property-control">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <ObjectTargetSelector
          value={property.value}
          objects={objects}
          onChange={onChange}
        />
      </div>
    );
  }
  
  // Readonly property
  if (property.readonly) {
    return (
      <div class="property-control">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <PropertyReadonly value={property.value} />
      </div>
    );
  }
  
  // Boolean property
  if (property.type === 'boolean') {
    return (
      <div class="property-control">
        <PropertyCheckbox
          checked={property.value}
          onChange={onChange}
          label={property.label}
        />
      </div>
    );
  }
  
  // Number property
  if (property.type === 'number') {
    return (
      <div class="property-control">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <PropertyNumber
          value={property.value}
          onChange={onChange}
          min={property.min}
          max={property.max}
          step={property.step}
        />
      </div>
    );
  }
  
  // Select property
  if (property.type === 'select' && property.options) {
    // Check if we need translation (e.g., camera modes)
    const needsTranslation = property.name === 'mode';
    const translationKey = needsTranslation ? 'editor.camera.modes' : undefined;
    
    return (
      <div class="property-control">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <PropertySelect
          value={property.value}
          options={property.options}
          onChange={onChange}
          translateOptions={needsTranslation}
          translationKeyPrefix={translationKey}
        />
      </div>
    );
  }
  
  // Color property
  if (property.type === 'color') {
    return (
      <div class="property-control">
        <label class="property-label" title={property.description}>
          {property.label}
        </label>
        <PropertyColor
          value={property.value}
          onChange={onChange}
        />
      </div>
    );
  }
  
  // Default: text input
  return (
    <div class="property-control">
      <label class="property-label" title={property.description}>
        {property.label}
      </label>
      <PropertyInput
        value={String(property.value)}
        onChange={onChange}
      />
    </div>
  );
}
