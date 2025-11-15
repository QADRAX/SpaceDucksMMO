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
  transformProperties?: { position: boolean; rotation: boolean; scale: boolean };
}

/**
 * Complete transform section container
 * 
 * Displays position, rotation, and scale controls
 * Can selectively hide transform properties based on object type
 */
export function TransformSection({ transform, onChange, transformProperties }: TransformSectionProps) {
  const { t } = useI18n();
  
  // Default to showing all properties if not specified
  const showPosition = transformProperties?.position ?? true;
  const showRotation = transformProperties?.rotation ?? true;
  const showScale = transformProperties?.scale ?? true;
  
  return (
    <div class="transform-section">
      <h3 class="section-title">{t('editor.objectInspector.transform')}</h3>
      
      <div class="transform-controls">
        {showPosition && (
          <PositionControl
            position={transform.position}
            onChange={(axis, value) => onChange('position', axis, value)}
          />
        )}
        
        {showRotation && (
          <RotationControl
            rotation={transform.rotation}
            onChange={(axis, value) => onChange('rotation', axis, value)}
          />
        )}
        
        {showScale && (
          <ScaleControl
            scale={transform.scale}
            onChange={(axis, value) => onChange('scale', axis, value)}
          />
        )}
      </div>
    </div>
  );
}
