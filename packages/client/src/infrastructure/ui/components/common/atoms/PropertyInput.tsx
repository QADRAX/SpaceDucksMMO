import './property-input.css';
import { useState, useEffect } from 'preact/hooks';

export interface PropertyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PropertyInput({ value, onChange, placeholder, disabled = false, className }: PropertyInputProps) {
  const [text, setText] = useState<string>(value ?? '');

  useEffect(() => {
    setText(value ?? '');
  }, [value]);

  const handleInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const raw = e.currentTarget.value;
    setText(raw);
    // For plain text inputs we accept any string as valid
    onChange(raw);
  };

  return (
    <input
      type="text"
      value={text}
      onInput={handleInput}
      placeholder={placeholder}
      className={`property-input ${className ?? ''}`}
      disabled={disabled}
    />
  );
}
