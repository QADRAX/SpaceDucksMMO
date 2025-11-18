/** @jsxImportSource preact */
import { h } from 'preact';
import './property-checkbox.css';

export interface PropertyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function PropertyCheckbox({ checked, onChange, label }: PropertyCheckboxProps) {
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(target.checked);
  };
  return (
    <label class="property-checkbox-wrapper">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        class="property-checkbox"
      />
      {label && <span class="checkbox-label">{label}</span>}
    </label>
  );
}
