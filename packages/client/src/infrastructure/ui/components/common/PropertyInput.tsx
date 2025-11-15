/** @jsxImportSource preact */
import { h } from 'preact';
import './property-input.css';

export interface PropertyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Text input for string properties
 * 
 * Simple text input with consistent styling
 */
export function PropertyInput({ value, onChange, placeholder }: PropertyInputProps) {
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(target.value);
  };
  
  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      class="property-input"
    />
  );
}
