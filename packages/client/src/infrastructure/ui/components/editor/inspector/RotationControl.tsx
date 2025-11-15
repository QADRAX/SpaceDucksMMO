/** @jsxImportSource preact */
import { h } from 'preact';
import { Vector3Input } from '../../common/Vector3Input';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import type * as THREE from 'three';

export interface RotationControlProps {
  rotation: THREE.Euler;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}

/**
 * Rotation vector control with degree ↔ radian conversion
 * 
 * Displays rotation in degrees but stores in radians
 */
export function RotationControl({ rotation, onChange }: RotationControlProps) {
  const { t } = useI18n();
  
  // Convert radians to degrees for display
  const convertToDegrees = (radians: number) => radians * 180 / Math.PI;
  
  // Convert degrees to radians for storage
  const convertToRadians = (degrees: number) => degrees * Math.PI / 180;
  
  return (
    <div class="rotation-control">
      <label class="control-label">{t('editor.transform.rotation')}</label>
      <Vector3Input
        value={rotation}
        onChange={onChange}
        step={1}
        precision={0}
        convertFrom={convertToDegrees}
        convertTo={convertToRadians}
      />
    </div>
  );
}
