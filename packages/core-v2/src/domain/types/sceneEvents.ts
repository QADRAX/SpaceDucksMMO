import type { ComponentType } from './componentType';

/** Event emitted when an entity is added to a scene. */
export type EntityAddedEvent = {
  readonly kind: 'entity-added';
  readonly entityId: string;
};

/** Event emitted when an entity is removed from a scene. */
export type EntityRemovedEvent = {
  readonly kind: 'entity-removed';
  readonly entityId: string;
};

/** Event emitted when an entity is reparented in the hierarchy. */
export type HierarchyChangedEvent = {
  readonly kind: 'hierarchy-changed';
  readonly childId: string;
  readonly newParentId: string | null;
};

/** Event emitted when the active camera changes. */
export type ActiveCameraChangedEvent = {
  readonly kind: 'active-camera-changed';
  readonly entityId: string | null;
};

/** Event emitted when an entity's transform is modified. */
export type TransformChangedEvent = {
  readonly kind: 'transform-changed';
  readonly entityId: string;
};

/** Event emitted when a component on an entity changes. */
export type ComponentChangedEvent = {
  readonly kind: 'component-changed';
  readonly entityId: string;
  readonly componentType: ComponentType;
};

/** Event emitted when a scene-wide debug flag is toggled. */
export type SceneDebugChangedEvent = {
  readonly kind: 'scene-debug-changed';
  readonly kindName: string;
  readonly enabled: boolean;
};

/** Event emitted when mesh debug visualization is toggled. */
export type SceneMeshDebugChangedEvent = {
  readonly kind: 'scene-mesh-debug-changed';
  readonly enabled: boolean;
};

/** Event emitted when collider debug visualization is toggled. */
export type SceneColliderDebugChangedEvent = {
  readonly kind: 'scene-collider-debug-changed';
  readonly enabled: boolean;
};

/** Event emitted when a scene operation fails. */
export type SceneErrorEvent = {
  readonly kind: 'error';
  readonly message: string;
};

/** Discriminated union of all scene change events. */
export type SceneChangeEvent =
  | EntityAddedEvent
  | EntityRemovedEvent
  | HierarchyChangedEvent
  | ActiveCameraChangedEvent
  | TransformChangedEvent
  | ComponentChangedEvent
  | SceneDebugChangedEvent
  | SceneMeshDebugChangedEvent
  | SceneColliderDebugChangedEvent;

/** Scene change event extended with error variant. */
export type SceneChangeEventWithError = SceneChangeEvent | SceneErrorEvent;
