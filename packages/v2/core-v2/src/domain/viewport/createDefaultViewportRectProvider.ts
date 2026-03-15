import type { ViewportId } from '../ids';
import type { ViewportRect } from './types';
import type { ViewportRectProviderPort } from '../ports/external/viewportRectProviderPort';
import { DEFAULT_RECT } from './constants';

/**
 * Creates a simple in-memory ViewportRectProviderPort.
 * Use for basic setups; replace with custom implementation for layout integration (web, Electron).
 */
export function createDefaultViewportRectProvider(): ViewportRectProviderPort {
  const rects = new Map<ViewportId, ViewportRect>();

  return {
    getRect(id) {
      return rects.get(id) ?? DEFAULT_RECT;
    },
    setRect(id, rect) {
      const current = rects.get(id) ?? DEFAULT_RECT;
      rects.set(id, { ...current, ...rect });
    },
  };
}
