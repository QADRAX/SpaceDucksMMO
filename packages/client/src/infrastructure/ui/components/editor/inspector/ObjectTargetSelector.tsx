/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './object-target-selector.css';

export interface ObjectTargetSelectorProps {
  value: string;
  objects: Array<{ id: string; typeName: string }>;
  onChange: (value: string) => void;
}

/**
 * Special object selector for camera target
 * 
 * Shows list of available objects with "Manual Position" option
 */
export function ObjectTargetSelector({
  value,
  objects,
  onChange
}: ObjectTargetSelectorProps) {
  const { t } = useI18n();
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange(target.value);
  };
  
  return (
    <select value={value} onChange={handleChange} class="object-target-selector">
      <option value="manual">{t('editor.camera.manualPosition')}</option>
      {objects.map(obj => (
        <option key={obj.id} value={obj.id}>
          {obj.typeName} - {obj.id}
        </option>
      ))}
    </select>
  );
}
