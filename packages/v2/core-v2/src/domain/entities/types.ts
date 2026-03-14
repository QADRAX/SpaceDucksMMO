import type {
  ComponentType,
  ComponentBase,
  ComponentListener,
  ComponentChangeListener,
} from '../components';

import type { Vec3Like, EulerLike } from '../math';
import type { EntityId } from '../ids';

/**
 * Debug visualization category.
 * Built-in kinds are 'transform', 'mesh', 'collider', and 'camera'.
 * Custom string values are allowed for engine extensions.
 */
export type DebugKind = 'transform' | 'mesh' | 'collider' | 'camera' | (string & {});

/** Listener for presentation changes (display name, gizmo icon). */
export type PresentationListener = (entityId: EntityId) => void;

/** Listener for debug flag changes. */
export type DebugListener = (entityId: EntityId, kind: DebugKind, enabled: boolean) => void;

/** Centralised observer hub for a single entity. */
export interface EntityObservers {
  fireComponentAdded(entityId: EntityId, comp: ComponentBase): void;
  fireComponentRemoved(entityId: EntityId, comp: ComponentBase): void;
  fireComponentChanged(entityId: EntityId, type: ComponentType): void;
  firePresentationChanged(entityId: EntityId): void;
  fireDebugChanged(entityId: EntityId, kind: DebugKind, enabled: boolean): void;

  addComponentListener(fn: ComponentListener): void;
  removeComponentListener(fn: ComponentListener): void;
  addChangeListener(fn: ComponentChangeListener): void;
  removeChangeListener(fn: ComponentChangeListener): void;
  addPresentationListener(fn: PresentationListener): void;
  removePresentationListener(fn: PresentationListener): void;
  addDebugListener(fn: DebugListener): void;
  removeDebugListener(fn: DebugListener): void;
}

/**
 * Mutable transform state used internally by the engine.
 * All mutation functions operate on this type directly.
 */
export interface TransformState {
  localPosition: Vec3Like;
  localRotation: EulerLike;
  localScale: Vec3Like;
  worldPosition: Vec3Like;
  worldRotation: EulerLike;
  worldScale: Vec3Like;
  parent: TransformState | undefined;
  dirty: boolean;
  changeCbs: Array<() => void>;
  parentCb: (() => void) | undefined;
}

/**
 * Mutable entity state used internally by the engine.
 * All mutation functions operate on this type directly.
 */
export interface EntityState {
  readonly id: EntityId;
  readonly transform: TransformState;
  readonly components: Map<ComponentType, ComponentBase>;
  /** Set of component types present on this entity. Kept in sync with components for O(1) "has any of these types" checks. */
  readonly componentTypes: Set<ComponentType>;
  readonly observers: EntityObservers;
  readonly debugFlags: Map<DebugKind, boolean>;
  readonly children: EntityState[];
  displayName: string;
  gizmoIcon: string | undefined;
  parent: EntityState | undefined;
}
