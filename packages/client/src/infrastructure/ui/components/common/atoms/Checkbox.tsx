import "./checkbox.css";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
};

export default function Checkbox({ checked, onChange, id, disabled }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      className="sd-checkbox"
      checked={checked}
      onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      disabled={disabled}
    />
  );
}
