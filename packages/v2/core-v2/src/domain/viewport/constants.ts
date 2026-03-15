import type { ViewportRect } from './types';

/** Rect with zero dimensions. Use when no dimensions are set; viewports with this rect are not rendered. */
export const ZERO_RECT: ViewportRect = { x: 0, y: 0, w: 0, h: 0 };

/**
 * Default rect when no dimensions are provided.
 * Zero size = no render until the consumer sets dimensions via ViewportRectProviderPort.
 */
export const DEFAULT_RECT: ViewportRect = ZERO_RECT;

/** Full normalized rect (entire viewport). Use for UI slots or when explicit full-size is needed. */
export const FULL_RECT: ViewportRect = { x: 0, y: 0, w: 1, h: 1 };

/** Returns true if the rect has renderable dimensions (w > 0 and h > 0). */
export function hasValidDimensions(rect: ViewportRect): boolean {
  return rect.w > 0 && rect.h > 0;
}
