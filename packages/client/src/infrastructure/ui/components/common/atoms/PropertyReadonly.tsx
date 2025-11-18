import './property-readonly.css';

export interface PropertyReadonlyProps {
  value: string | number | boolean;
}

export function PropertyReadonly({ value }: PropertyReadonlyProps) {
  return (
    <span className="property-readonly">{String(value)}</span>
  );
}
