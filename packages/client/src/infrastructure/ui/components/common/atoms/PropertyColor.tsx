/** @jsxImportSource preact */
import { h } from 'preact';
import './property-color.css';

export interface PropertyColorProps {
  value: number; // Hex number (e.g., 0xff69b4)
  onChange: (value: number) => void;
}

export function PropertyColor({ value, onChange }: PropertyColorProps) {
  const colorString = `#${value.toString(16).padStart(6, '0')}`;
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const hexNumber = parseInt(target.value.slice(1), 16);
    onChange(hexNumber);
  };
  return (
    <div class="property-color-wrapper">
      <input
        type="color"
        value={colorString}
        onChange={handleChange}
        class="property-color"
      />
      <span class="color-hex">{colorString.toUpperCase()}</span>
    </div>
  );
}
