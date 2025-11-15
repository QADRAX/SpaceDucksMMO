/** @jsxImportSource preact */
import { h } from 'preact';
import { ComponentSection } from '../ComponentSection';
import type { ManagedComponent } from '@client/domain/scene/IComponentManager';
import type { SceneEditor } from '@client/application/SceneEditor';
import './components-list.css';

export interface ComponentsListProps {
  components: ManagedComponent[];
  onToggle: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onPropertyChange: (instanceId: string, propName: string, value: any) => void;
  editor?: SceneEditor;
}

/**
 * List of managed components
 * 
 * Renders ComponentSection for each managed component
 */
export function ComponentsList({
  components,
  onToggle,
  onRemove,
  onPropertyChange,
  editor
}: ComponentsListProps) {
  
  return (
    <div class="components-list">
      {components.map(managed => (
        <ComponentSection
          key={managed.instanceId}
          managedComponent={managed}
          onToggle={onToggle}
          onRemove={onRemove}
          onPropertyChange={onPropertyChange}
          editor={editor}
        />
      ))}
    </div>
  );
}
