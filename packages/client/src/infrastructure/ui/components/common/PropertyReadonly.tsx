/** @jsxImportSource preact */
import { h } from 'preact';
import './property-readonly.css';

export interface PropertyReadonlyProps {
  value: string | number | boolean;
}

/**
 * Display-only property value
 * 
 * Shows a value that cannot be edited
 */
export function PropertyReadonly({ value }: PropertyReadonlyProps) {
  return (
    <span class="property-readonly">
      {String(value)}
    </span>
  );
}
