import type { PropertyValue } from '@duckengine/core-v2';

/** Vec3-like shape used by Lua scripts (math.vec3). Not in core PropertyValue but accepted at runtime. */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/** Property value after normalization. Extends PropertyValue with Vec3Like for Lua compatibility. */
export type NormalizedPropertyValue = PropertyValue | Vec3Like;

/**
 * Normalizes vec3-like values from Lua (e.g. math.vec3) to plain { x, y, z } for ECS.
 * Lua tables with x, y, z may cross the Lua/JS boundary as userdata or proxies;
 * this ensures a plain object with numeric coordinates.
 *
 * @param value - Raw value from Lua or JS.
 * @returns Plain { x, y, z } if value has x/y/z keys; otherwise returns value unchanged.
 */
export function normalizeVec3Like(value: unknown): NormalizedPropertyValue {
  if (
    value != null &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    'z' in value
  ) {
    const v = value as { x: unknown; y: unknown; z: unknown };
    return { x: Number(v.x), y: Number(v.y), z: Number(v.z) };
  }
  return value as NormalizedPropertyValue;
}
