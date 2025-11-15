/** @jsxImportSource preact */
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import type { ManagedComponent, ComponentMetadata } from '@client/domain/scene/IComponentManager';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import type { SceneEditor } from '@client/application/SceneEditor';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { PropertyControl } from './inspector/PropertyControl';
import './component-section.css';

export interface ComponentSectionProps {
  managedComponent: ManagedComponent;
  onToggle: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onPropertyChange: (instanceId: string, propName: string, value: any) => void;
  editor?: SceneEditor;
}

/**
 * ComponentSection - Displays a single component with its properties
 * 
 * Shows:
 * - Component header (name, icon, category)
 * - Enable/disable toggle
 * - Remove button
 * - Collapsible properties section
 */
export function ComponentSection({ managedComponent, onToggle, onRemove, onPropertyChange, editor }: ComponentSectionProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  
  const { instanceId, component, enabled, metadata } = managedComponent;
  
  // Get properties if component is inspectable
  const isInspectable = 'getInspectableProperties' in component;
  const properties: InspectableProperty[] = isInspectable 
    ? (component as any).getInspectableProperties() 
    : [];

  const handlePropertyChange = (propName: string, value: any) => {
    onPropertyChange(instanceId, propName, value);
  };

  return (
    <div class={`component-section ${!enabled ? 'disabled' : ''}`}>
      {/* Header */}
      <div class="component-header">
        <button
          class="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        
        <span class="component-icon">{metadata.icon || '🔹'}</span>
        
        <div class="component-info">
          <span class="component-name">{metadata.displayName}</span>
          <span class="component-category">{metadata.category}</span>
        </div>
        
        <div class="component-actions">
          <button
            class={`toggle-btn ${enabled ? 'enabled' : 'disabled'}`}
            onClick={() => onToggle(instanceId)}
            title={enabled ? 'Disable component' : 'Enable component'}
          >
            {enabled ? '👁️' : '👁️‍🗨️'}
          </button>
          
          <button
            class="remove-btn"
            onClick={() => onRemove(instanceId)}
            title="Remove component"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Description */}
      {metadata.description && !collapsed && (
        <div class="component-description">
          {metadata.description}
        </div>
      )}
      
      {/* Properties */}
      {!collapsed && properties.length > 0 && (
        <div class="component-properties">
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
      
      {/* No properties message */}
      {!collapsed && properties.length === 0 && (
        <div class="no-properties">
          <small>No configurable properties</small>
        </div>
      )}
    </div>
  );
}

export default ComponentSection;
