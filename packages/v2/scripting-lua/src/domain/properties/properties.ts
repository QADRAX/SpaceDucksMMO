import type { PropertyValue, PropertyValues } from '@duckengine/core-v2';

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
  prev: PropertyValues,
  next: PropertyValues,
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
  target: PropertyValues,
  source: PropertyValues,
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
export function shallowEqual(a: PropertyValue | undefined, b: PropertyValue | undefined): boolean {
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
    return false; // Vec3/Vec2/Color are arrays, handled above. No other objects in PropertyValue.
  }

  return false;
}
