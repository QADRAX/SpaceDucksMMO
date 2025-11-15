/** @jsxImportSource preact */
import { h } from 'preact';
import { VectorAxisInput } from './VectorAxisInput';
import './vector3-input.css';

export interface Vector3InputProps {
  value: { x: number; y: number; z: number };
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number; // Display conversion
  convertTo?: (value: number) => number;   // Storage conversion
}

/**
 * Three-axis vector input (X, Y, Z)
 * 
 * Features:
 * - Unified interface for 3D vectors
 * - Optional value conversion per axis
 * - Compact horizontal layout
 * - Consistent styling
 */
export function Vector3Input({
  value,
  onChange,
  step = 0.1,
  min,
  precision = 2,
  convertFrom,
  convertTo
}: Vector3InputProps) {
  
  return (
    <div class="vector3-input">
      <VectorAxisInput
        label="X"
        value={value.x}
        onChange={(v) => onChange('x', v)}
        step={step}
        min={min}
        precision={precision}
        convertFrom={convertFrom}
        convertTo={convertTo}
      />
      <VectorAxisInput
        label="Y"
        value={value.y}
        onChange={(v) => onChange('y', v)}
        step={step}
        min={min}
        precision={precision}
        convertFrom={convertFrom}
        convertTo={convertTo}
      />
      <VectorAxisInput
        label="Z"
        value={value.z}
        onChange={(v) => onChange('z', v)}
        step={step}
        min={min}
        precision={precision}
        convertFrom={convertFrom}
        convertTo={convertTo}
      />
    </div>
  );
}
