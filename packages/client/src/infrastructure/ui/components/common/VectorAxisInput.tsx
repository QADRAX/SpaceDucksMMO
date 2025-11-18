/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
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

  const [text, setText] = useState<string>(
    Number.isFinite(displayValue) ? String(displayValue.toFixed(precision)) : ''
  );

  useEffect(() => {
    // keep local text in sync when external value changes
    setText(Number.isFinite(displayValue) ? String(displayValue.toFixed(precision)) : '');
  }, [displayValue, precision]);

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const raw = target.value;
    setText(raw);
    if (raw === '') return;
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return;
    const finalValue = convertTo ? convertTo(parsed) : parsed;
    onChange(finalValue);
  };

  return (
    <div class="vector-axis-input">
      <label class="axis-label">{label}</label>
      <input
        type="number"
        value={text}
        onInput={handleInput}
        onChange={handleInput}
        step={step}
        min={min}
        class="axis-input"
      />
    </div>
  );
}
