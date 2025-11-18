/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import './transform-group.css';

export interface TransformGroupProps {
  label: string;
  children: ComponentChildren;
}

export function TransformGroup({ label, children }: TransformGroupProps) {
  return (
    <div class="transform-group">
      <span class="transform-label">{label}</span>
      <div class="transform-inputs">
        {children}
      </div>
    </div>
  );
}
