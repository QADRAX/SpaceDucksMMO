/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { PropertyControl } from './PropertyControl';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import './properties-section.css';

export interface PropertiesSectionProps {
  properties: InspectableProperty[];
  onChange: (name: string, value: any) => void;
  editor?: SceneEditor;
}

/**
 * Legacy properties container
 * 
 * For objects without component management system
 */
export function PropertiesSection({
  properties,
  onChange,
  editor
}: PropertiesSectionProps) {
  const { t } = useI18n();
  
  if (properties.length === 0) {
    return null;
  }
  
  return (
    <div class="properties-section">
      <h3 class="section-title">{t('editor.objectInspector.properties')}</h3>
      
      <div class="properties-list">
        {properties.map(prop => (
          <PropertyControl
            key={prop.name}
            property={prop}
            onChange={(value) => onChange(prop.name, value)}
            editor={editor}
          />
        ))}
      </div>
    </div>
  );
}
