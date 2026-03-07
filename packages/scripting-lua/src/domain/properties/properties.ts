/**
 * Compares previous and incoming property bags and returns
 * the set of keys whose values changed.
 *
 * Uses strict equality for primitives and shallow structural
 * comparison for plain objects and arrays. This replaces the
 * v1 JSON.stringify diff with an O(k) scan where k = key count.
 *
 * @param prev - Previously synced property snapshot.
 * @param next - Current properties from the ECS component.
 * @returns Array of changed keys (empty if nothing changed).
 */
export function diffProperties(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  const changed: string[] = [];

  for (const key of Object.keys(next)) {
    if (!shallowEqual(prev[key], next[key])) {
      changed.push(key);
    }
  }

  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      changed.push(key);
    }
  }

  return changed;
}

/** Applies changed properties from ECS into the slot's property bag. */
export function applyPropertyChanges(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  changedKeys: ReadonlyArray<string>,
): void {
  for (const key of changedKeys) {
    if (key in source) {
      target[key] = source[key];
    } else {
      delete target[key];
    }
  }
}

/** Shallow equality check for primitives, arrays, and plain objects. */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as Record<string, unknown>);
    const kb = Object.keys(b as Record<string, unknown>);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
    }
    return true;
  }

  return false;
}
