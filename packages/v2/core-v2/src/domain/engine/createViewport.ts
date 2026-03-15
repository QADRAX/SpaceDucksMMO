import type { ViewportState, CreateViewportParams } from '../viewport';

/** Creates a mutable viewport state with sensible defaults. Pure factory. */
export function createViewport(params: CreateViewportParams): ViewportState {
  return {
    id: params.id,
    sceneId: params.sceneId,
    cameraEntityId: params.cameraEntityId,
    canvasId: params.canvasId,
    enabled: params.enabled ?? true,
    debugFlags: new Map(),
  };
}
