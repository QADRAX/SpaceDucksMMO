import { useState } from 'preact/hooks';
import './property-number.css';
import { Slider } from '../molecules/Slider';

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
    <div className="property-number">
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
