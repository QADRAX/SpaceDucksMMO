import type { ViewportState, ViewportView } from './types';

/**
 * Creates a readonly snapshot of the viewport state.
 */
export function createViewportView(viewport: ViewportState): ViewportView {
    return {
        id: viewport.id,
        sceneId: viewport.sceneId,
        cameraEntityId: viewport.cameraEntityId,
        canvasId: viewport.canvasId,
        rect: { ...viewport.rect },
        enabled: viewport.enabled,
    };
}
