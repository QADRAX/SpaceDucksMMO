import './property-readonly.css';

export interface PropertyReadonlyProps {
  value: string | number | boolean;
  className?: string;
}

export function PropertyReadonly({ value, className = "" }: PropertyReadonlyProps) {
  return (
    <span className={`property-readonly ${className}`.trim()}>{String(value)}</span>
  );
}
