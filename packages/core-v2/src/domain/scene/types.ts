import type { EntityState, DebugKind } from '../entities';
import type { ComponentType } from '../components';

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

/** Event emitted when scene adapters have been registered and the scene is ready. */
export type SceneSetupEvent = {
  readonly kind: 'scene-setup';
};

/** Event emitted when a scene is about to be torn down. */
export type SceneTeardownEvent = {
  readonly kind: 'scene-teardown';
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
  | SceneColliderDebugChangedEvent
  | SceneSetupEvent
  | SceneTeardownEvent;

/** Scene change event extended with error variant. */
export type SceneChangeEventWithError = SceneChangeEvent | SceneErrorEvent;

/**
 * Listener signature for scene change events.
 * Receives the scene state and the event that was emitted.
 */
export type SceneChangeListener = (scene: SceneState, event: SceneChangeEventWithError) => void;

/**
 * A scene system adapter reacts to scene change events and
 * participates in the frame-update pipeline.
 */
export interface SceneSystemAdapter {
  /** React to a scene change event (reactive channel). */
  handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void;
  /** Advance one frame tick (synchronous pipeline). */
  update?(scene: SceneState, dt: number): void;
  /** If true, `update()` is called even when the scene is paused. */
  updateWhenPaused?: boolean;
  /** Release resources when the adapter is detached from the scene. */
  dispose?(): void;
}

/**
 * Mutable scene state operated on by application-layer use cases.
 * Created by `createScene`, mutated by use-case functions.
 */
export interface SceneState {
  readonly id: string;
  readonly entities: Map<string, EntityState>;
  readonly rootEntityIds: string[];
  activeCameraId: string | null;
  readonly debugFlags: Map<DebugKind, boolean>;
  readonly changeListeners: Set<SceneChangeListener>;
  /** Cleanup functions for detaching entity observers, keyed by entity id. */
  readonly entityCleanups: Map<string, () => void>;
  /** Registered adapters in update-pipeline order. */
  readonly adapters: SceneSystemAdapter[];
  /** When true, only adapters with updateWhenPaused run during update. */
  paused: boolean;
}
