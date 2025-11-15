/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { PositionControl } from './PositionControl';
import { RotationControl } from './RotationControl';
import { ScaleControl } from './ScaleControl';
import type * as THREE from 'three';
import './transform-section.css';

export interface TransformSectionProps {
  transform: THREE.Object3D;
  onChange: (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => void;
}

/**
 * Complete transform section container
 * 
 * Displays position, rotation, and scale controls
 */
export function TransformSection({ transform, onChange }: TransformSectionProps) {
  const { t } = useI18n();
  
  return (
    <div class="transform-section">
      <h3 class="section-title">{t('editor.objectInspector.transform')}</h3>
      
      <div class="transform-controls">
        <PositionControl
          position={transform.position}
          onChange={(axis, value) => onChange('position', axis, value)}
        />
        
        <RotationControl
          rotation={transform.rotation}
          onChange={(axis, value) => onChange('rotation', axis, value)}
        />
        
        <ScaleControl
          scale={transform.scale}
          onChange={(axis, value) => onChange('scale', axis, value)}
        />
      </div>
    </div>
  );
}
