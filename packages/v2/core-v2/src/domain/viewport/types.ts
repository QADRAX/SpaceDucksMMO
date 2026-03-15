import type { EntityId, SceneId, ViewportId, CanvasId } from '../ids';
import type { DebugKind } from '../entities';

/** Normalised rectangle (all values 0–1). */
export interface ViewportRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * A viewport binds a camera in a scene to a region of a canvas.
 *
 * Multiple viewports can point to the same scene (split-screen,
 * minimap) or to different scenes (editor + preview).
 *
 * Rect is provided by ViewportRectProviderPort (consumer responsibility).
 */
export interface Viewport {
  readonly id: ViewportId;
  /** Which scene this viewport renders. */
  readonly sceneId: SceneId;
  /** Which camera entity to use (overrides scene.activeCameraId). */
  readonly cameraEntityId: EntityId;
  /** Target canvas identifier. */
  readonly canvasId: CanvasId;
  /** Whether this viewport is rendered. */
  readonly enabled: boolean;
  /** Per-viewport debug visualization toggles (e.g. collider, mesh). */
  readonly debugFlags: ReadonlyMap<DebugKind, boolean>;
}

/**
 * Mutable viewport state operated on by application-layer viewport use cases.
 * Created by `createViewport`, mutated by viewport use-case functions.
 *
 * Rect is provided by ViewportRectProviderPort (consumer responsibility).
 */
export interface ViewportState {
  readonly id: ViewportId;
  /** Which scene this viewport renders. */
  sceneId: SceneId;
  /** Which camera entity to use (overrides scene.activeCameraId). */
  cameraEntityId: EntityId;
  /** Target canvas identifier. */
  canvasId: CanvasId;
  /** Whether this viewport is rendered. */
  enabled: boolean;
  /** Per-viewport debug visualization toggles (e.g. collider, mesh). */
  debugFlags: Map<DebugKind, boolean>;
}

/** Readonly snapshot of a viewport for application/UI consumers. */
export interface ViewportView {
  readonly id: ViewportId;
  readonly sceneId: SceneId;
  readonly cameraEntityId: EntityId;
  readonly canvasId: CanvasId;
  readonly rect: ViewportRect;
  readonly enabled: boolean;
  readonly debugFlags: ReadonlyMap<DebugKind, boolean>;
}

/** Parameters for creating a viewport. */
export interface CreateViewportParams {
  readonly id: ViewportId;
  readonly sceneId: SceneId;
  readonly cameraEntityId: EntityId;
  readonly canvasId: CanvasId;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}
