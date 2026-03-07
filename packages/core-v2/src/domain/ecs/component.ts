import type { ComponentType } from '../types/componentType';
import type { ComponentMetadata } from '../types/componentMetadata';

/**
 * Base shape shared by all ECS components.
 * Components are plain data objects — no methods, no observers.
 * All mutation and notification is handled by the entity layer.
 */
export interface ComponentBase<TType extends ComponentType = ComponentType> {
  readonly type: TType;
  readonly metadata: ComponentMetadata;
  enabled: boolean;
}

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
