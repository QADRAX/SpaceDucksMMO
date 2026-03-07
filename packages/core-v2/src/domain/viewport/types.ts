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
 */
export interface Viewport {
  readonly id: string;
  /** Which scene this viewport renders. */
  readonly sceneId: string;
  /** Which camera entity to use (overrides scene.activeCameraId). */
  readonly cameraEntityId: string;
  /** Target canvas identifier. */
  readonly canvasId: string;
  /** Normalised region inside the canvas. */
  readonly rect: ViewportRect;
  /** Whether this viewport is rendered. */
  readonly enabled: boolean;
}

/**
 * Mutable viewport state operated on by application-layer viewport use cases.
 * Created by `createViewport`, mutated by viewport use-case functions.
 */
export interface ViewportState {
  readonly id: string;
  /** Which scene this viewport renders. */
  sceneId: string;
  /** Which camera entity to use (overrides scene.activeCameraId). */
  cameraEntityId: string;
  /** Target canvas identifier. */
  canvasId: string;
  /** Normalised region inside the canvas. */
  rect: ViewportRect;
  /** Whether this viewport is rendered. */
  enabled: boolean;
}

/** Readonly snapshot of a viewport for application/UI consumers. */
export interface ViewportView {
  readonly id: string;
  readonly sceneId: string;
  readonly cameraEntityId: string;
  readonly canvasId: string;
  readonly rect: ViewportRect;
  readonly enabled: boolean;
}

/** Parameters for creating a viewport. */
export interface CreateViewportParams {
  readonly id: string;
  readonly sceneId: string;
  readonly cameraEntityId: string;
  readonly canvasId: string;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}
