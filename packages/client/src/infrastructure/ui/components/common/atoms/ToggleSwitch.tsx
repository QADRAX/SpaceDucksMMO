import './toggle-switch.css';
import { h } from 'preact';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function ToggleSwitch({ checked, onChange, label, className }: ToggleSwitchProps) {
  return (
    <label className={`toggle-switch-wrapper ${className ?? ''}`}>
      <input
        type="checkbox"
        className="toggle-switch-input"
        checked={checked}
        onChange={e => onChange((e.target as HTMLInputElement).checked)}
      />
      <span className="toggle-switch-slider" />
      {label && <span className="toggle-switch-label">{label}</span>}
    </label>
  );
}

export default ToggleSwitch;
