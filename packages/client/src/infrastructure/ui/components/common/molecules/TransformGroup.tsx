import { type ComponentChildren } from 'preact';
import './transform-group.css';

export interface TransformGroupProps {
  label: string;
  children: ComponentChildren;
  className?: string;
}

export function TransformGroup({ label, children, className = "" }: TransformGroupProps) {
  return (
    <div className={`transform-group ${className}`.trim()}>
      <span className="transform-label">{label}</span>
      <div className="transform-inputs">{children}</div>
    </div>
  );
}
