import { type ComponentChildren } from 'preact';
import './transform-group.css';

export interface TransformGroupProps {
  label: string;
  children: ComponentChildren;
}

export function TransformGroup({ label, children }: TransformGroupProps) {
  return (
    <div className="transform-group">
      <span className="transform-label">{label}</span>
      <div className="transform-inputs">{children}</div>
    </div>
  );
}
