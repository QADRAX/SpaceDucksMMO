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
  enabled: boolean;
}
