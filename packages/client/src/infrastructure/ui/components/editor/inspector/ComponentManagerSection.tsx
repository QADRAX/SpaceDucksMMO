/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { ComponentPicker } from '../ComponentPicker';
import { ComponentsList } from './ComponentsList';
import { EmptyComponentsView } from './EmptyComponentsView';
import { getAvailableComponents } from '../availableComponents';
import { availableCameraComponents } from '@client/application/editor/inspector/availableCameraComponents';
import type { IComponentManager } from '@client/domain/scene/IComponentManager';
import type { SceneEditor } from '@client/application/SceneEditor';
import './component-manager-section.css';

export interface ComponentManagerSectionProps {
  componentManager: IComponentManager;
  onToggle: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onPropertyChange: (instanceId: string, propName: string, value: any) => void;
  onAdd: (factory: () => any, metadata: { displayName: string; category: string; icon: string; description: string }) => void;
  editor?: SceneEditor;
}

/**
 * Detects if the component manager is a camera
 * 
 * Checks both:
 * 1. Type name includes 'Camera'
 * 2. Existing components have camera behavior metadata
 */
function isCameraComponentManager(componentManager: IComponentManager): boolean {
  // Check if it has getTypeName and returns Camera
  if ('getTypeName' in componentManager && typeof (componentManager as any).getTypeName === 'function') {
    const typeName = (componentManager as any).getTypeName();
    if (typeof typeName === 'string' && typeName.includes('Camera')) {
      return true;
    }
  }
  
  // Fallback: Check component metadata
  const components = componentManager.getManagedComponents();
  return components.some(c => 
    c.metadata.category === 'Camera Behavior' || 
    c.metadata.displayName?.includes('Orbit') ||
    c.metadata.displayName?.includes('Look At') ||
    c.metadata.displayName?.includes('Tracking')
  );
}

/**
 * Component management UI
 * 
 * Features:
 * - Component picker for adding new components
 * - List of managed components
 * - Empty state when no components
 * - Auto-detects camera vs visual objects
 */
export function ComponentManagerSection({
  componentManager,
  onToggle,
  onRemove,
  onPropertyChange,
  onAdd,
  editor
}: ComponentManagerSectionProps) {
  const { t } = useI18n();
  const components = componentManager.getManagedComponents();
  
  // Detect if this is a camera by checking existing components
  const isCamera = isCameraComponentManager(componentManager);
  
  // Use appropriate component registry
  const availableComponents = isCamera 
    ? availableCameraComponents.map(c => ({
        id: c.metadata.displayName.toLowerCase().replace(/\s+/g, '-'),
        name: c.metadata.displayName,
        category: c.metadata.category,
        description: c.metadata.description || '',
        icon: c.metadata.icon || '🎯',
        factory: c.factory
      }))
    : getAvailableComponents();
  
  return (
    <div class="component-manager-section">
      <h3 class="section-title">{t('editor.objectInspector.components')}</h3>
      
      <ComponentPicker
        availableComponents={availableComponents}
        onAdd={onAdd}
      />
      
      {components.length > 0 ? (
        <ComponentsList
          components={components}
          onToggle={onToggle}
          onRemove={onRemove}
          onPropertyChange={onPropertyChange}
          editor={editor}
        />
      ) : (
        <EmptyComponentsView />
      )}
    </div>
  );
}
