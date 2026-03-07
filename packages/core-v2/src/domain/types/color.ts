/** RGB color with channel values in the 0–1 range. */
export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
}

/** Hex color string (e.g. '#ff0000' or '#f00'). */
export type HexColor = `#${string}`;

/**
 * A color value accepted by engine APIs.
 * Either a hex string or an RGB(A) object with channels in 0–1.
 */
export type Color = HexColor | RgbColor;
