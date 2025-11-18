/** @jsxImportSource preact */
import { h } from 'preact';
import { useState } from 'preact/hooks';
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
  // Local string state to allow free typing without the input being clobbered
  const [text, setText] = useState<string>(
    Number.isFinite(value) ? String(value) : ''
  );

  // Note: avoid heavy hooks here to minimize re-renders; implement lightweight handlers
  const handleRangeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    if (!isNaN(newValue)) onChange(newValue);
  };

  const handleNumberInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const raw = target.value;
    // allow empty string while typing
    if (raw === "") {
      setText("");
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      setText(String(parsed));
      onChange(parsed);
    } else {
      // keep the user's input locally
      setText(raw);
    }
  };

  // compute display values
  const sliderValue = Number.isFinite(value) ? value : min;
  const numberValue = text === undefined || text === null || text === '' ? (Number.isFinite(value) ? String(value) : '') : text;

  return (
    <div class="property-number">
      <input
        type="range"
        value={sliderValue}
        onInput={handleRangeChange}
        min={min}
        max={max}
        step={step}
        class="property-slider"
      />
      <input
        type="number"
        value={numberValue}
        onInput={handleNumberInput}
        min={min}
        max={max}
        step={step}
        class="property-number-display"
      />
    </div>
  );
}
