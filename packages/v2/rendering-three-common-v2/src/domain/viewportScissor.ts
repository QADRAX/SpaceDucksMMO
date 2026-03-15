import type { ViewportRect } from '@duckengine/core-v2';

/**
 * Computes pixel viewport/scissor rect from normalized viewport rect and canvas dimensions.
 * Pure function: no side effects.
 */
export function computeViewportScissor(
  canvasWidth: number,
  canvasHeight: number,
  rect: ViewportRect,
): { x: number; y: number; w: number; h: number } {
  return {
    x: Math.floor(rect.x * canvasWidth),
    y: Math.floor(rect.y * canvasHeight),
    w: Math.floor(rect.w * canvasWidth),
    h: Math.floor(rect.h * canvasHeight),
  };
}
