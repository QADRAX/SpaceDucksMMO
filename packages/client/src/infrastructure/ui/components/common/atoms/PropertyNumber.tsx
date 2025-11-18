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

export function PropertyNumber({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1
}: PropertyNumberProps) {
  const [text, setText] = useState<string>(
    Number.isFinite(value) ? String(value) : ''
  );

  const handleRangeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    if (!isNaN(newValue)) onChange(newValue);
  };

  const handleNumberInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const raw = target.value;
    if (raw === "") {
      setText("");
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      setText(String(parsed));
      onChange(parsed);
    } else {
      setText(raw);
    }
  };

  const sliderValue = Number.isFinite(value) ? value : min;
  const numberValue = text === undefined || text === null || text === '' ? (Number.isFinite(value) ? String(value) : '') : text;

  return (
    <div class="property-number">
      <input
        type="range"
        value={sliderValue as any}
        onInput={handleRangeChange}
        min={min}
        max={max}
        step={step}
        class="property-slider"
      />
      <input
        type="number"
        value={numberValue as any}
        onInput={handleNumberInput}
        min={min}
        max={max}
        step={step}
        class="property-number-display"
      />
    </div>
  );
}
