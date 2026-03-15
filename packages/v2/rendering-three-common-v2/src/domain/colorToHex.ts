import type { Color, RgbColor } from '@duckengine/core-v2';
import { parseColor } from './parseColor';

/**
 * Converts a Color (hex string or RgbColor) to a Three.js hex number (0xRRGGBB).
 */
export function colorToHex(color: Color | undefined, defaultHex = 0xffffff): number {
  if (!color) return defaultHex;
  if (typeof color === 'string') return parseColor(color, defaultHex);
  const rgb = color as RgbColor;
  const r = Math.round(Math.max(0, Math.min(1, rgb.r)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, rgb.g)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, rgb.b)) * 255);
  return (r << 16) | (g << 8) | b;
}
