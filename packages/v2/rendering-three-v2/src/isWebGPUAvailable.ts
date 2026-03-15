/**
 * Detects if WebGPU is available in the current environment.
 * Agnostic of browser vs Node: in Node, navigator is undefined → false.
 */
export function isWebGPUAvailable(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof (navigator as { gpu?: unknown }).gpu !== 'undefined';
}
