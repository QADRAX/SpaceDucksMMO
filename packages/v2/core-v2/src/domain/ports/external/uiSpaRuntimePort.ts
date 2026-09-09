import type { EntityId, SceneId, ViewportId } from '../../ids';
import type { ResourceRef } from '../../resources';
import type { UIRootLayout, UISurfaceHandle } from '../../ui';

/**
 * Context passed to a custom SPA when mounted (host adapter → SPA author).
 * Props and events stay JSON-serializable at the engine boundary.
 */
export interface SpaMountContext {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
  /** Initial snapshot from `uiSpa.props`. */
  readonly props: Readonly<Record<string, unknown>>;
  /** Subscribe to prop patches from ECS / Lua. Returns unsubscribe. */
  onProps(listener: (props: Readonly<Record<string, unknown>>) => void): () => void;
  /** Emit an event toward scripts / scene event bus. */
  emit(eventName: string, payload?: unknown): void;
}

/** Parameters to mount a custom SPA on a surface. */
export interface UISpaMountParams {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
  readonly surface: UISurfaceHandle;
  readonly layout: UIRootLayout;
  readonly spa: ResourceRef<'spa'>;
  readonly context: SpaMountContext;
}

/** Parameters to update an already-mounted SPA root. */
export interface UISpaUpdateParams {
  readonly entityId: EntityId;
  readonly viewportId: ViewportId;
  readonly layout?: UIRootLayout;
  readonly props?: Readonly<Record<string, unknown>>;
}

/**
 * Custom SPA runtime backend.
 * Loads resolved `spa` resources and attaches them to viewport surfaces.
 */
export interface UISpaRuntimePort {
  /** Mounts a SPA for an entity root on a viewport surface. */
  mount(params: UISpaMountParams): void | Promise<void>;

  /** Updates layout and/or props for a mounted SPA. */
  update(params: UISpaUpdateParams): void | Promise<void>;

  /** Unmounts the SPA from the viewport surface. */
  unmount(entityId: EntityId, viewportId: ViewportId): void | Promise<void>;
}
