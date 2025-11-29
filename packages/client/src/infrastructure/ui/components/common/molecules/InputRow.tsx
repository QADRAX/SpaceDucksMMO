import "./input.css";
import { PropertyInput } from "../atoms/PropertyInput";

type InputRowProps = {
  label?: string;
  value: string;
  onInput: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "email" | "url";
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function InputRow({
  label,
  value,
  onInput,
  placeholder,
  type = "text",
  error,
  disabled = false,
  className = "",
}: InputRowProps) {
  return (
    <div className={`sd-input-row ${className}`.trim()}>
      {label && <label className="sd-input-label">{label}</label>}
      {type === "text" ? (
        <PropertyInput
          value={value}
          onChange={onInput}
          placeholder={placeholder}
          disabled={disabled}
          className={`sd-input ${error ? "sd-input--error" : ""}`}
        />
      ) : (
        <input
          type={type}
          className={`sd-input ${error ? "sd-input--error" : ""}`}
          value={value}
          onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => onInput(e.currentTarget.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
      {error && <span className="sd-input-error">{error}</span>}
    </div>
  );
}
