import "./checkbox.css";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ checked, onChange, id, disabled, className }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      className={`sd-checkbox ${className ?? ''}`}
      checked={checked}
      onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => onChange(e.currentTarget.checked)}
      disabled={disabled}
    />
  );
}
