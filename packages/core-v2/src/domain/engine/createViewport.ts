import type { ViewportState, CreateViewportParams } from '../viewport';
import { DEFAULT_RECT } from '../viewport/constants';

/** Creates a mutable viewport state with sensible defaults. Pure factory. */
export function createViewport(params: CreateViewportParams): ViewportState {
  return {
    id: params.id,
    sceneId: params.sceneId,
    cameraEntityId: params.cameraEntityId,
    canvasId: params.canvasId,
    rect: { ...DEFAULT_RECT, ...params.rect },
    enabled: params.enabled ?? true,
  };
}
