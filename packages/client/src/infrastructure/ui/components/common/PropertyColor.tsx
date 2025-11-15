/** @jsxImportSource preact */
import { h } from 'preact';
import './property-color.css';

export interface PropertyColorProps {
  value: number; // Hex number (e.g., 0xff69b4)
  onChange: (value: number) => void;
}

/**
 * Color picker for hex colors
 * 
 * Converts between hex number and color string
 */
export function PropertyColor({ value, onChange }: PropertyColorProps) {
  
  // Convert hex number to color string
  const colorString = `#${value.toString(16).padStart(6, '0')}`;
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    // Convert color string to hex number
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
