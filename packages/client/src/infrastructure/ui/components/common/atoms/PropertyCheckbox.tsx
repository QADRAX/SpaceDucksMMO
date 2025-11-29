import './property-checkbox.css';
import { Checkbox } from './Checkbox';

export interface PropertyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function PropertyCheckbox({ checked, onChange, label, className }: PropertyCheckboxProps) {
  return (
    <label className={`property-checkbox-wrapper ${className ?? ''}`}>
      <Checkbox checked={checked} onChange={onChange} className="property-checkbox" />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
}
