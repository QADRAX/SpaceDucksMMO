/** @jsxImportSource preact */
import { h } from 'preact';
import './vector-axis-input.css';

export interface VectorAxisInputProps {
  label: 'X' | 'Y' | 'Z';
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number; // Display conversion (e.g., radians to degrees)
  convertTo?: (value: number) => number;   // Storage conversion (e.g., degrees to radians)
}

/**
 * Single axis input for vector values (X, Y, or Z)
 * 
 * Features:
 * - Optional value conversion (e.g., degrees ↔ radians)
 * - Configurable precision
 * - Min/max/step support
 * - Compact design
 */
export function VectorAxisInput({
  label,
  value,
  onChange,
  step = 0.1,
  min,
  precision = 2,
  convertFrom,
  convertTo
}: VectorAxisInputProps) {
  
  // Display value with conversion if needed
  const displayValue = convertFrom ? convertFrom(value) : value;
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = parseFloat(target.value);
    
    if (isNaN(rawValue)) return;
    
    // Apply conversion if needed
    const finalValue = convertTo ? convertTo(rawValue) : rawValue;
    onChange(finalValue);
  };
  
  return (
    <div class="vector-axis-input">
      <label class="axis-label">{label}</label>
      <input
        type="number"
        value={displayValue.toFixed(precision)}
        onChange={handleChange}
        step={step}
        min={min}
        class="axis-input"
      />
    </div>
  );
}
