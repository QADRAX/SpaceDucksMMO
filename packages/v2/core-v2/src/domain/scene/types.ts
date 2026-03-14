import type { EntityState, DebugKind } from '../entities';
import type { ComponentType } from '../components';
import type { SceneSubsystem, PortDefinition } from '../subsystems';
import type { EntityId, PrefabId, SceneId, UISlotId } from '../ids';
import type { UISlotState } from '../ui';
import type { EngineState } from '../engine';

/** Event emitted when an entity is added to a scene. */
export type EntityAddedEvent = {
  readonly kind: 'entity-added';
  readonly entityId: EntityId;
};

/** Event emitted when an entity is removed from a scene. */
export type EntityRemovedEvent = {
  readonly kind: 'entity-removed';
  readonly entityId: EntityId;
};

/** Event emitted when a prefab is added to the scene's prefab cache. */
export type ScenePrefabAddedEvent = {
  readonly kind: 'prefab-added';
  readonly prefabId: PrefabId;
};

/** Event emitted when a prefab is removed from the scene's prefab cache. */
export type ScenePrefabRemovedEvent = {
  readonly kind: 'prefab-removed';
  readonly prefabId: PrefabId;
};

/** Event emitted when an entity is reparented in the hierarchy. */
export type HierarchyChangedEvent = {
  readonly kind: 'hierarchy-changed';
  readonly childId: EntityId;
  readonly newParentId: EntityId | null;
};

/** Event emitted when the active camera changes. */
export type ActiveCameraChangedEvent = {
  readonly kind: 'active-camera-changed';
  readonly entityId: EntityId | null;
};

/** Event emitted when an entity's transform is modified. */
export type TransformChangedEvent = {
  readonly kind: 'transform-changed';
  readonly entityId: EntityId;
};

/** Event emitted when a component on an entity changes. */
export type ComponentChangedEvent = {
  readonly kind: 'component-changed';
  readonly entityId: EntityId;
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

/** Event emitted when a UI slot is added to a scene. */
export type UISlotAddedEvent = {
  readonly kind: 'ui-slot-added';
  readonly slotId: UISlotId;
};

/** Event emitted when a UI slot is removed from a scene. */
export type UISlotRemovedEvent = {
  readonly kind: 'ui-slot-removed';
  readonly slotId: UISlotId;
};

/** Event emitted when a UI slot is updated. */
export type UISlotUpdatedEvent = {
  readonly kind: 'ui-slot-updated';
  readonly slotId: UISlotId;
};

/** Event emitted when a scene operation fails. */
export type SceneErrorEvent = {
  readonly kind: 'error';
  readonly message: string;
};

/** Event emitted when a script has a compile, load, or runtime error. */
export type ScriptErrorEvent = {
  readonly kind: 'script-error';
  readonly slotKey: string;
  readonly phase: 'compile' | 'load' | 'hook';
  readonly hookName?: string;
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
  | ScenePrefabAddedEvent
  | ScenePrefabRemovedEvent
  | SceneSetupEvent
  | SceneTeardownEvent
  | UISlotAddedEvent
  | UISlotRemovedEvent
  | UISlotUpdatedEvent;

/** Scene change event extended with error variants. */
export type SceneChangeEventWithError = SceneChangeEvent | SceneErrorEvent | ScriptErrorEvent;

/**
 * Listener signature for scene change events.
 * Receives the scene state and the event that was emitted.
 */
export type SceneChangeListener = (scene: SceneState, event: SceneChangeEventWithError) => void;

/**
 * Mutable scene state operated on by application-layer use cases.
 * Created by `createScene`, mutated by use-case functions.
 * `engine` is set when the scene is added to the engine via addSceneToEngine.
 */
export interface SceneState {
  readonly id: SceneId;
  /** Set when scene is added to engine. Used for engine-level event subscription. */
  engine?: EngineState;
  readonly entities: Map<EntityId, EntityState>;
  readonly rootEntityIds: EntityId[];
  activeCameraId: EntityId | null;
  readonly debugFlags: Map<DebugKind, boolean>;
  readonly changeListeners: Set<SceneChangeListener>;
  /** Cleanup functions for detaching entity observers, keyed by entity id. */
  readonly entityCleanups: Map<EntityId, () => void>;
  /** Registered subsystems in update-pipeline order. */
  readonly subsystems: SceneSubsystem[];
  /** Cached prefabs (entities not in active scene graph but instantiable). */
  readonly prefabs: Map<string, EntityState>;
  /** UI slots for this scene. Client adapter mounts SPAs per slot. */
  readonly uiSlots: Map<UISlotId, UISlotState>;
  /** When true, only subsystems with updateWhenPaused run during update. */
  paused: boolean;
  /** Per-scene port implementations, keyed by port id. Scene subsystems register here. */
  readonly scenePorts: Map<string, unknown>;
  /** Per-scene port definitions, keyed by port id. */
  readonly scenePortDefinitions: Map<string, PortDefinition<unknown>>;
}

/** Readonly snapshot of a scene for application/UI consumers. */
export interface SceneView {
  readonly id: SceneId;
  readonly paused: boolean;
  readonly activeCameraId: EntityId | null;
  readonly rootEntityIds: ReadonlyArray<EntityId>;
  readonly debugFlags: ReadonlyMap<DebugKind, boolean>;
  readonly prefabs: ReadonlyMap<PrefabId, EntityState>;
  readonly uiSlots: ReadonlyMap<UISlotId, UISlotState>;
}
