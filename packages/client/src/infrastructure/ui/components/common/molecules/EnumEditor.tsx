import { h } from 'preact';
import { Select } from './Select';
import './enum-editor.css';

export type EnumOption = {
  value: string | number;
  label: string;
  icon?: preact.ComponentChildren;
};

export type EnumEditorProps = {
  value: string | number | null;
  options: EnumOption[];
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  className?: string;
};

export function EnumEditor({ value, options, onChange, placeholder, className = "" }: EnumEditorProps) {
  return (
    <Select
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={`enum-editor ${className}`.trim()}
    />
  );
}

export default EnumEditor;
