import { VectorAxisInput } from '../atoms/VectorAxisInput';
import './vector3-input.css';

export interface Vector3InputProps {
  value: { x: number; y: number; z: number };
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number;
  convertTo?: (value: number) => number;
  className?: string;
}

export function Vector3Input({
  value,
  onChange,
  step = 0.1,
  min,
  precision = 2,
  convertFrom,
  convertTo
  , className = ""
}: Vector3InputProps) {
  const axes: Array<['X'|'Y'|'Z', 'x'|'y'|'z']> = [['X','x'], ['Y','y'], ['Z','z']];
  return (
    <div className={`vector3-input ${className}`.trim()}>
      {axes.map(([label, axis]) => (
        <VectorAxisInput
          key={axis}
          label={label}
          value={value[axis]}
          onChange={(v) => onChange(axis, v)}
          step={step}
          min={min}
          precision={precision}
          convertFrom={convertFrom}
          convertTo={convertTo}
        />
      ))}
    </div>
  );
}
