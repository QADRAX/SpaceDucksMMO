import './property-color.css';
import { useState, useEffect } from 'preact/hooks';

export interface PropertyColorProps {
  value: number; // Hex number (e.g., 0xff69b4)
  onChange: (value: number) => void;
  className?: string;
}

export function PropertyColor({ value, onChange, className = "" }: PropertyColorProps) {
  const initial = `#${value.toString(16).padStart(6, '0')}`;
  const [color, setColor] = useState<string>(initial);

  useEffect(() => {
    setColor(`#${value.toString(16).padStart(6, '0')}`);
  }, [value]);

  const handleInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const val = e.currentTarget.value;
    setColor(val);
    const hexNumber = parseInt(val.slice(1), 16);
    onChange(hexNumber);
  };

  return (
    <div className={`property-color-wrapper ${className}`.trim()}>
      <input
        type="color"
        value={color}
        onInput={handleInput}
        className="property-color"
      />
      <span className="color-hex">{color.toUpperCase()}</span>
    </div>
  );
}
