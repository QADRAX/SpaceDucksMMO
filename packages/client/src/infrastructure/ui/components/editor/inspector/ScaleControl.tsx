/** @jsxImportSource preact */
import { h } from 'preact';
import { Vector3Input } from '../../common/Vector3Input';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import type * as THREE from 'three';

export interface ScaleControlProps {
  scale: THREE.Vector3;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}

/**
 * Scale vector control with min validation
 * 
 * Prevents scale from going below 0.01 to avoid visual issues
 */
export function ScaleControl({ scale, onChange }: ScaleControlProps) {
  const { t } = useI18n();
  
  return (
    <div class="scale-control">
      <label class="control-label">{t('editor.transform.scale')}</label>
      <Vector3Input
        value={scale}
        onChange={onChange}
        step={0.1}
        min={0.01}
        precision={2}
      />
    </div>
  );
}
