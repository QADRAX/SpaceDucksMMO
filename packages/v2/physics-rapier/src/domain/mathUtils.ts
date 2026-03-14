/** Euclidean norm of (x, y, z); returns 1 if zero to avoid division by zero. */
export function norm(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z) || 1;
}
