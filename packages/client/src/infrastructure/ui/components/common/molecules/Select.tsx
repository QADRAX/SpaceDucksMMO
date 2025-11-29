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
  className?: string;
};

export function Select({ value, onChange, options, id, disabled, className = "" }: SelectProps) {
  return (
    <select
      id={id}
      className={`sd-select ${className}`.trim()}
      value={value}
      onInput={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) => onChange(e.currentTarget.value)}
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
