/** @jsxImportSource preact */
import { h } from 'preact';
import { Vector3Input } from '../../common/Vector3Input';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import type * as THREE from 'three';

export interface PositionControlProps {
  position: THREE.Vector3;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}

/**
 * Position vector control
 * 
 * Three-axis position input with appropriate step size
 */
export function PositionControl({ position, onChange }: PositionControlProps) {
  const { t } = useI18n();
  
  return (
    <div class="position-control">
      <label class="control-label">{t('editor.transform.position')}</label>
      <Vector3Input
        value={position}
        onChange={onChange}
        step={0.1}
        precision={2}
      />
    </div>
  );
}
