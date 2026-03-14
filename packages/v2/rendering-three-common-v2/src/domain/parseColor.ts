/**
 * Parses a hex color string to a number (0xRRGGBB). Pure, no Three dependency.
 * @param hex - e.g. '#ff0000' or 'ff0000'
 * @param defaultHex - value if parse fails (default 0xffffff)
 */
export function parseColor(hex: string, defaultHex = 0xffffff): number {
  const n = parseInt(hex.replace(/^#/, ''), 16);
  return isNaN(n) ? defaultHex : n;
}
