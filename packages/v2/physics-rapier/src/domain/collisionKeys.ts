/**
 * Canonical key for a pair of collider handles (order-independent).
 * Used to track collision pairs (enter/exit/stay) without duplicating (a,b) and (b,a).
 */
export function pairKey(h1: number, h2: number): string {
  return h1 < h2 ? `${h1}|${h2}` : `${h2}|${h1}`;
}
