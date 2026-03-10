import type { ScriptSchema } from '@duckengine/core-v2';
import { BuiltInScripts } from '@duckengine/core-v2';

/** Schemas for built-in scripts. Used to resolve entityRef/entityRefArray for self.references. */
export const BUILT_IN_SCHEMAS: Record<string, ScriptSchema> = {
  [BuiltInScripts.WaypointPath]: {
    name: 'Waypoint Path (V2)',
    description: 'Sequences movement through entity waypoints.',
    properties: {
      speed: { type: 'number', default: 3 },
      loop: { type: 'boolean', default: true },
      waypoints: { type: 'entityRefArray', default: [] },
      easing: { type: 'string', default: 'cubicInOut' },
      arrivalThreshold: { type: 'number', default: 0.2 },
    },
  },
  [BuiltInScripts.MoveToPoint]: {
    name: 'Move to Point (V2)',
    description: 'Interpolates position towards a target point.',
    properties: {
      targetPoint: { type: 'vec3', default: [0, 0, 0] },
      duration: { type: 'number', default: 2.0 },
      easing: { type: 'string', default: 'cubicInOut' },
      delay: { type: 'number', default: 0 },
    },
  },
};

/**
 * Returns the schema for a built-in script, or null if not found.
 *
 * @param scriptId - Script identifier (e.g. 'builtin://move_to_point.lua').
 * @returns Schema or null.
 */
export function getBuiltInSchema(scriptId: string): ScriptSchema | null {
  return BUILT_IN_SCHEMAS[scriptId] ?? null;
}
