import type { EntityId, SceneId, ViewportId } from '../../ids';
import type { ResourceRef } from '../../resources';
import type { UIRootLayout, UISurfaceHandle } from '../../ui';

/**
 * Context passed to a custom UI when mounted (host adapter → UI author).
 * Props and events stay JSON-serializable at the engine boundary.
 */
export interface CustomUiMountContext {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
  /** Initial snapshot from `uiCustom.props`. */
  readonly props: Readonly<Record<string, unknown>>;
  /** Subscribe to prop patches from ECS / Lua. Returns unsubscribe. */
  onProps(listener: (props: Readonly<Record<string, unknown>>) => void): () => void;
  /** Emit an event toward scripts / scene event bus. */
  emit(eventName: string, payload?: unknown): void;
}

/** Parameters to mount a custom UI on a surface. */
export interface UICustomMountParams {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
  readonly surface: UISurfaceHandle;
  readonly layout: UIRootLayout;
  readonly spa: ResourceRef<'spa'>;
  readonly context: CustomUiMountContext;
}

/** Parameters to update an already-mounted custom UI root. */
export interface UICustomUpdateParams {
  readonly entityId: EntityId;
  readonly viewportId: ViewportId;
  readonly layout?: UIRootLayout;
  readonly props?: Readonly<Record<string, unknown>>;
}

/**
 * Custom UI runtime backend (delegated from the shared UI subsystem).
 * Loads resolved `spa` resources and attaches them to viewport surfaces.
 */
export interface UICustomRuntimePort {
  /** Mounts a custom UI for an entity root on a viewport surface. */
  mount(params: UICustomMountParams): void | Promise<void>;

  /** Updates layout and/or props for a mounted custom UI. */
  update(params: UICustomUpdateParams): void | Promise<void>;

  /** Unmounts the custom UI from the viewport surface. */
  unmount(entityId: EntityId, viewportId: ViewportId): void | Promise<void>;
}
