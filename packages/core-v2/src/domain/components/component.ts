import type {  ComponentType  } from './types';
import type {  ComponentMetadata  } from './types';
import type { ComponentBase } from './types';

/**
 * Initialises the common component fields.
 * Concrete component factories call this, then merge domain-specific fields.
 */
export function componentBase<TType extends ComponentType>(
  type: TType,
  metadata: ComponentMetadata,
): ComponentBase<TType> {
  return { type, metadata, enabled: true };
}

/**
 * Type-safe accessor: narrows a ComponentBase to a specific component shape.
 * Returns `undefined` when the type tag does not match.
 */
export function narrowComponent<T extends ComponentBase>(
  comp: ComponentBase | undefined,
  type: T['type'],
): T | undefined {
  return comp && comp.type === type ? (comp as T) : undefined;
}
