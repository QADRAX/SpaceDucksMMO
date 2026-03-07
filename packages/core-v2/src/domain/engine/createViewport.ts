import type { Viewport, ViewportRect } from '../types/viewport';

/** Parameters for creating a viewport. */
export interface CreateViewportParams {
  readonly id: string;
  readonly sceneId: string;
  readonly cameraEntityId: string;
  readonly canvasId: string;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}

const DEFAULT_RECT: ViewportRect = { x: 0, y: 0, w: 1, h: 1 };

/** Creates a viewport with sensible defaults. Pure factory. */
export function createViewport(params: CreateViewportParams): Viewport {
  return {
    id: params.id,
    sceneId: params.sceneId,
    cameraEntityId: params.cameraEntityId,
    canvasId: params.canvasId,
    rect: { ...DEFAULT_RECT, ...params.rect },
    enabled: params.enabled ?? true,
  };
}
