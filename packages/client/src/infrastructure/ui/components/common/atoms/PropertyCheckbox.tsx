import './property-checkbox.css';

export interface PropertyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function PropertyCheckbox({ checked, onChange, label }: PropertyCheckboxProps) {
  const handleInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    onChange(e.currentTarget.checked);
  };
  return (
    <label className="property-checkbox-wrapper">
      <input
        type="checkbox"
        checked={checked}
        onInput={handleInput}
        className="property-checkbox"
      />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
}
