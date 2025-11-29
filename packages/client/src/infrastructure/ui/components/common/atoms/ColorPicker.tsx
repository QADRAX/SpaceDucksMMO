import { h } from 'preact';

export interface ColorPickerProps {
  value: string | number;
  onChange: (color: string | number) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  // Convert value to hex string
  let hex = '#ffffff';
  if (typeof value === 'number') {
    hex = '#' + (value >>> 0).toString(16).padStart(6, '0');
  } else if (typeof value === 'string') {
    if (value.startsWith('#')) hex = value;
    else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) hex = '#' + parsed.toString(16).padStart(6, '0');
    }
  }

  const handleChange = (e: any) => {
    let v = e.target.value;
    if (v.startsWith('#')) v = v.slice(1);
    const num = parseInt(v, 16);
    onChange(num);
  };

  return (
    <input type="color" value={hex} onInput={handleChange} />
  );
}

export default ColorPicker;
