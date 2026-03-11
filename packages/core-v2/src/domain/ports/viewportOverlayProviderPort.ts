import type { ViewportId } from '../ids';

/**
 * Port that provides the DOM container where UI overlays are mounted per viewport.
 * Infrastructure (e.g. Three.js renderer) creates an overlay div per canvas.
 */
export interface ViewportOverlayProviderPort {
  /**
   * Returns the DOM element where UI overlays are mounted for the given viewport.
   */
  getOverlayContainer(viewportId: ViewportId): HTMLElement | null;
}
