import { definePort } from '@duckengine/core-v2';
import type { PhysicsQueryPort } from '@duckengine/core-v2';

/** Port id must match SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery in scripting-lua. */
export const PHYSICS_QUERY_PORT_ID = 'io:physics-query';

export const physicsQueryPortDef = definePort<PhysicsQueryPort>(PHYSICS_QUERY_PORT_ID)
  .addMethod('raycast')
  .addMethod('getCollisionEvents')
  .build();
