/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import './transform-group.css';

export interface TransformGroupProps {
  label: string;
  children: ComponentChildren;
}

/**
 * Labeled group container for transform controls
 * 
 * Provides consistent styling and layout for position, rotation, scale
 */
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
