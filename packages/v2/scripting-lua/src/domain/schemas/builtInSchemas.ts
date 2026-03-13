import type { ScriptSchema } from '@duckengine/core-v2';
import { BuiltInScriptIds } from '../../infrastructure/wasmoon/generated/ScriptAssets';

/** Schemas for built-in scripts. Used to resolve entityRef/entityRefArray for self.references. */
export const BUILT_IN_SCHEMAS: Record<string, ScriptSchema> = {
  [BuiltInScriptIds.WaypointPath]: {
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
  [BuiltInScriptIds.MoveToPoint]: {
    name: 'Move to Point (V2)',
    description: 'Interpolates position towards a target point.',
    properties: {
      targetPoint: { type: 'vec3', default: [0, 0, 0] },
      duration: { type: 'number', default: 2.0 },
      easing: { type: 'string', default: 'cubicInOut' },
      delay: { type: 'number', default: 0 },
    },
  },
  [BuiltInScriptIds.LookAtPoint]: {
    name: 'Look at Point (V2)',
    description: 'Continuously rotates this entity to face a static 3D world coordinate.',
    properties: {
      targetPoint: { type: 'vec3', default: [0, 0, 0] },
    },
  },
  [BuiltInScriptIds.RotateContinuous]: {
    name: 'Rotate Continuous (V2)',
    description: 'Spins the entity at a constant rate in degrees per second.',
    properties: {
      speedX: { type: 'number', default: 0 },
      speedY: { type: 'number', default: 45 },
      speedZ: { type: 'number', default: 0 },
    },
  },
  [BuiltInScriptIds.Bounce]: {
    name: 'Bounce (V2)',
    description: 'Oscillates the entity on a single axis using a sine wave.',
    properties: {
      axis: { type: 'string', default: 'y' },
      amplitude: { type: 'number', default: 0.5 },
      frequency: { type: 'number', default: 1 },
    },
  },
  [BuiltInScriptIds.DestroyAfter]: {
    name: 'Destroy After (V2)',
    description: 'Automatically destroys this entity after a given number of seconds.',
    properties: {
      lifetime: { type: 'number', default: 5 },
    },
  },
  [BuiltInScriptIds.Billboard]: {
    name: 'Billboard (V2)',
    description: 'Entity always faces the camera. Optionally Y-locked.',
    properties: {
      cameraEntity: { type: 'entityRef', default: '' },
      lockY: { type: 'boolean', default: false },
    },
  },
  [BuiltInScriptIds.LookAtEntity]: {
    name: 'Look at Entity (V2)',
    description: 'Smoothly rotates this entity to face a target entity.',
    properties: {
      targetEntityId: { type: 'entityRef', default: '' },
      speed: { type: 'number', default: 5 },
      lookAtOffset: { type: 'vec3', default: [0, 0, 0] },
    },
  },
  [BuiltInScriptIds.SpawnOnInterval]: {
    name: 'Spawn on Interval (V2)',
    description: 'Spawns a prefab periodically at this entity\'s position.',
    properties: {
      prefab: { type: 'prefabRef', default: '' },
      interval: { type: 'number', default: 2 },
      maxCount: { type: 'number', default: 10 },
      offset: { type: 'vec3', default: [0, 0, 0] },
    },
  },
  [BuiltInScriptIds.FollowEntity]: {
    name: 'Follow Entity (Kinematic) (V2)',
    description: 'Follows a target entity with smoothing and optional time delay.',
    properties: {
      targetEntityId: { type: 'entityRef', default: '' },
      delay: { type: 'number', default: 0.5 },
      speed: { type: 'number', default: 5 },
      offset: { type: 'vec3', default: [0, 5, 5] },
    },
  },
  [BuiltInScriptIds.SmoothFollow]: {
    name: 'Smooth Follow (Eased) (V2)',
    description: 'Follows a target using configurable easing curves.',
    properties: {
      targetEntityId: { type: 'entityRef', default: '' },
      duration: { type: 'number', default: 1.0 },
      easing: { type: 'string', default: 'quadOut' },
      offset: { type: 'vec3', default: [0, 5, 5] },
    },
  },
  [BuiltInScriptIds.SmoothLookAt]: {
    name: 'Smooth Look At (V2)',
    description: 'Smoothly rotates to face a target using easing curves.',
    properties: {
      targetEntityId: { type: 'entityRef', default: '' },
      speed: { type: 'number', default: 3 },
      easing: { type: 'string', default: 'sineOut' },
      offset: { type: 'vec3', default: [0, 0, 0] },
    },
  },
  [BuiltInScriptIds.OrbitCamera]: {
    name: 'Orbit Camera (V2)',
    description: 'Orbits this entity around a target at a fixed distance and speed.',
    properties: {
      targetEntityId: { type: 'entityRef', default: '' },
      altitudeFromSurface: { type: 'number', default: 0 },
      speed: { type: 'number', default: 0.5 },
      orbitPlane: { type: 'string', default: 'xz' },
      initialAngle: { type: 'number', default: 0 },
    },
  },
  [BuiltInScriptIds.FirstPersonMove]: {
    name: 'First Person Move (Kinematic) (V2)',
    description: 'WASD movement and optional flying.',
    properties: {
      moveSpeed: { type: 'number', default: 5 },
      sprintMultiplier: { type: 'number', default: 2 },
      flyMode: { type: 'boolean', default: false },
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
