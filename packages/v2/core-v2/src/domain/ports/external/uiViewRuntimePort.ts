import type { EntityId, SceneId, ViewportId } from '../../ids';
import type { UiNode } from '../../components/types/ui';
import type { ResourceRef } from '../../resources';
import type { UIRootLayout, UISurfaceHandle } from '../../ui';

/** Parameters to mount a Duck UI document on a surface. */
export interface UIViewMountParams {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
  readonly surface: UISurfaceHandle;
  readonly layout: UIRootLayout;
  /** Inline tree or resource ref from `uiView.document`. */
  readonly document: UiNode | ResourceRef<'uiDocument'> | null;
  readonly bindings: Readonly<Record<string, unknown>>;
}

/** Parameters to update an already-mounted Duck UI root. */
export interface UIViewUpdateParams {
  readonly entityId: EntityId;
  readonly viewportId: ViewportId;
  readonly layout?: UIRootLayout;
  readonly document?: UiNode | ResourceRef<'uiDocument'> | null;
  readonly bindings?: Readonly<Record<string, unknown>>;
}

/**
 * Duck UI document runtime (default kit backend).
 * Host-agnostic: web/DOM, canvas, or native implementations bind this port.
 */
export interface UIViewRuntimePort {
  /** Mounts a Duck UI document for an entity root on a viewport surface. */
  mount(params: UIViewMountParams): void | Promise<void>;

  /** Updates layout and/or document/bindings for a mounted root. */
  update(params: UIViewUpdateParams): void | Promise<void>;

  /** Unmounts the Duck UI root from the viewport surface. */
  unmount(entityId: EntityId, viewportId: ViewportId): void | Promise<void>;
}
