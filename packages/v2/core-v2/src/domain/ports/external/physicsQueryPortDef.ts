import { definePort } from '../../subsystems/definePort';
import type { PhysicsQueryPort } from './physicsQueryPort';

/** Port id; must match SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery in scripting-lua. */
export const PHYSICS_QUERY_PORT_ID = 'io:physics-query';

/**
 * Definition for the PhysicsQueryPort.
 * Exposes raycasting, collision events, and teleportBody to the engine.
 */
export const PhysicsQueryPortDef = definePort<PhysicsQueryPort>(PHYSICS_QUERY_PORT_ID)
  .addMethod('raycast')
  .addMethod('getCollisionEvents')
  .addMethod('teleportBody')
  .build();
