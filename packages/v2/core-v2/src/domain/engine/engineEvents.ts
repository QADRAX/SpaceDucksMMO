import type { ResourceRef } from '../resources/ref';
import type { ResourceKind } from '../resources/kinds';

/** Event emitted when a resource has been loaded into the cache. */
export interface ResourceLoadedEvent {
  readonly kind: 'resource-loaded';
  readonly ref: ResourceRef<ResourceKind>;
}

/** Discriminated union of all engine change events. */
export type EngineChangeEvent = ResourceLoadedEvent;
