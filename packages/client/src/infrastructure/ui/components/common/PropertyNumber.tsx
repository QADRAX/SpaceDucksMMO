/** @jsxImportSource preact */
import { h } from 'preact';
import './property-number.css';

export interface PropertyNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Number input with slider
 * 
 * Features:
 * - Range slider for visual adjustment
 * - Number input for precise values
 * - Synchronized dual controls
 */
export function PropertyNumber({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1
}: PropertyNumberProps) {
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };
  
  return (
    <div class="property-number">
      <input
        type="range"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        class="property-slider"
      />
      <input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        class="property-number-display"
      />
    </div>
  );
}
