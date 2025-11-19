import { h } from 'preact';
import { Vector3Input } from './Vector3Input';

export type Vector3EditorProps = {
  value: [number, number, number] | { x: number; y: number; z: number };
  onChange: (value: [number, number, number]) => void;
  step?: number;
  min?: number;
  precision?: number;
  className?: string;
};

export function Vector3Editor({ value, onChange, step = 0.1, min, precision = 2, className = "" }: Vector3EditorProps) {
  // Accept both array and object
  const obj = Array.isArray(value)
    ? { x: value[0] || 0, y: value[1] || 0, z: value[2] || 0 }
    : value;

  const handleChange = (axis: 'x' | 'y' | 'z', v: number) => {
    const next: [number, number, number] = [obj.x, obj.y, obj.z];
    if (axis === 'x') next[0] = v;
    if (axis === 'y') next[1] = v;
    if (axis === 'z') next[2] = v;
    onChange(next);
  };

  return (
    <Vector3Input
      value={obj}
      onChange={handleChange}
      step={step}
      min={min}
      precision={precision}
      className={className}
    />
  );
}

export default Vector3Editor;
