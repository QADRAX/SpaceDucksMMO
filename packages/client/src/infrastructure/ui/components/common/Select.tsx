import "./select.css";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  disabled?: boolean;
};

export default function Select({ value, onChange, options, id, disabled }: SelectProps) {
  return (
    <select
      id={id}
      className="sd-select"
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
