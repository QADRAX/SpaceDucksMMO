import { useState, useEffect } from 'preact/hooks';
import './property-number.css';
import { Slider } from '../molecules/Slider';

export interface PropertyNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function PropertyNumber({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1
  , className = ""
}: PropertyNumberProps) {
  const [text, setText] = useState<string>(
    Number.isFinite(value) ? String(value) : ''
  );

  // Keep local text in sync when external `value` prop changes.
  // This implements the semi-controlled pattern: the user can type
  // intermediate values (e.g. '-', '3.') without immediately forcing
  // the external value, but when the outside value changes we reflect it.
  useEffect(() => {
    setText(Number.isFinite(value) ? String(value) : '');
  }, [value]);

  const handleNumberInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const raw = e.currentTarget.value;
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

  const numberValue = text === undefined || text === null || text === '' ? (Number.isFinite(value) ? String(value) : '') : text;

  return (
    <div className={`property-number ${className}`.trim()}>
      <Slider value={Number.isFinite(value) ? value : min} onChange={onChange} min={min} max={max} step={step} showTooltip={false} />
      <input
        type="number"
        value={numberValue}
        onInput={handleNumberInput}
        min={min}
        max={max}
        step={step}
        className="property-number-display"
      />
    </div>
  );
}
