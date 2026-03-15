import type { ViewportId } from '../ids';
import type { ViewportRect } from './types';
import type { ViewportState, ViewportView } from './types';

/**
 * Creates a readonly snapshot of the viewport state.
 * Rect is resolved via getRect (from ViewportRectProviderPort).
 */
export function createViewportView(
  viewport: ViewportState,
  getRect: (viewportId: ViewportId) => ViewportRect,
): ViewportView {
  const rect = getRect(viewport.id);
  return {
    id: viewport.id,
    sceneId: viewport.sceneId,
    cameraEntityId: viewport.cameraEntityId,
    canvasId: viewport.canvasId,
    rect: { ...rect },
    enabled: viewport.enabled,
    debugFlags: new Map(viewport.debugFlags),
  };
}
