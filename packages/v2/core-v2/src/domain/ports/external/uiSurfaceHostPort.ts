import type { ViewportId } from '../../ids';
import type { UISurfaceHandle } from '../../ui';

/**
 * Provides a host surface per viewport where UI roots attach.
 * Web adapters typically return a DOM overlay; other hosts return canvas/native handles.
 * Core addresses surfaces by viewport id — never by HTMLElement types.
 */
export interface UISurfaceHostPort {
  /**
   * Returns the surface for the viewport, or `undefined` when unavailable.
   */
  getSurface(viewportId: ViewportId): UISurfaceHandle | undefined;
}
