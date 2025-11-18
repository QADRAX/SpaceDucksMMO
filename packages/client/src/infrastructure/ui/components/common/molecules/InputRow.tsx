import "./input.css";

type InputRowProps = {
  label?: string;
  value: string;
  onInput: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "email" | "url";
  error?: string;
  disabled?: boolean;
};

export default function InputRow({
  label,
  value,
  onInput,
  placeholder,
  type = "text",
  error,
  disabled = false,
}: InputRowProps) {
  return (
    <div className="sd-input-row">
      {label && <label className="sd-input-label">{label}</label>}
      <input
        type={type}
        className={`sd-input ${error ? "sd-input--error" : ""}`}
        value={value}
        onInput={(e: Event) => onInput((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <span className="sd-input-error">{error}</span>}
    </div>
  );
}
