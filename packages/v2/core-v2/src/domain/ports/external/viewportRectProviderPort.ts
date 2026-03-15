import type { ViewportId } from '../../ids';
import type { ViewportRect } from '../../viewport/types';

/**
 * Port that provides viewport rect (normalized region within canvas).
 * Consumer implements based on their layout (web, Electron, etc.).
 * Injected by render subsystem; used by rendering, resizeViewport, listViewports.
 */
export interface ViewportRectProviderPort {
  getRect(viewportId: ViewportId): ViewportRect;
  setRect(viewportId: ViewportId, rect: Partial<ViewportRect>): void;
}
