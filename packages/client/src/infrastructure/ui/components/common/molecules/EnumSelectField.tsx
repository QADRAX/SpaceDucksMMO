import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import SelectField, { SelectOption } from './SelectField';

type LabelFn = (key: string, val: string | number) => string;

type Props<E extends string | number = string> = {
  enumObject: Record<string, string | number>;
  value: E | null;
  onChange: (v: E | null) => void;
  placeholder?: string;
  className?: string;
  labelFn?: LabelFn;
};

function isNumericKey(k: string) {
  return !isNaN(Number(k));
}

export function EnumSelectField<E extends string | number = string>({
  enumObject,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  labelFn,
}: Props<E>) {
  const options = useMemo(() => {
    // For numeric enums TS emits reverse mapping (numeric keys). Filter numeric keys out.
    const keys = Object.keys(enumObject).filter((k) => !isNumericKey(k));
    const opts: SelectOption<E>[] = keys.map((k) => {
      const val = enumObject[k] as E;
      return { value: val, label: labelFn ? labelFn(k, val) : k };
    });
    return opts;
  }, [enumObject, labelFn]);

  return <SelectField value={value} options={options} placeholder={placeholder} onChange={onChange} className={className} />;
}

export default EnumSelectField;
