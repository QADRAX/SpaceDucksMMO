import type { ComponentMetadata } from './componentMetadata';

/**
 * Static definition for a component type.
 * Links editor metadata with the default field values.
 * Used by the generic factory to stamp new component instances.
 */
export type ComponentSpec<TComponent = unknown> = {
  readonly metadata: ComponentMetadata<TComponent>;
  readonly defaults: Omit<TComponent, 'type' | 'metadata' | 'enabled'>;
};
