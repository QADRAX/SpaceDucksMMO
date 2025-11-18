import { useState, useEffect } from 'preact/hooks';
import './vector-axis-input.css';

export interface VectorAxisInputProps {
  label: 'X' | 'Y' | 'Z';
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number;
  convertTo?: (value: number) => number;
  className?: string;
}

export function VectorAxisInput({
  label,
  value,
  onChange,
  step = 0.1,
  min,
  precision = 2,
  convertFrom,
  convertTo
  , className = ""
}: VectorAxisInputProps) {
  const displayValue = convertFrom ? convertFrom(value) : value;

  const [text, setText] = useState<string>(
    Number.isFinite(displayValue) ? String(displayValue.toFixed(precision)) : ''
  );

  useEffect(() => {
    setText(Number.isFinite(displayValue) ? String(displayValue.toFixed(precision)) : '');
  }, [displayValue, precision]);

  const handleInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const raw = e.currentTarget.value;
    setText(raw);
    if (raw === '') return;
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return;
    const finalValue = convertTo ? convertTo(parsed) : parsed;
    onChange(finalValue);
  };

  return (
    <div className={`vector-axis-input ${className}`.trim()}>
      <label className="axis-label">{label}</label>
      <input
        type="number"
        value={text}
        onInput={handleInput}
        step={step}
        min={min}
        className="axis-input"
      />
    </div>
  );
}
