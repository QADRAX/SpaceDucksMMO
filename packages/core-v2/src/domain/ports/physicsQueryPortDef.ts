import { definePort } from '../subsystems/definePort';
import type { PhysicsQueryPort } from './physicsQueryPort';

/**
 * Definition for the PhysicsQueryPort.
 * Exposes raycasting and collision event draining to the engine.
 */
export const PhysicsQueryPortDef = definePort<PhysicsQueryPort>('physicsQuery')
    .addMethod('raycast')
    .addMethod('getCollisionEvents')
    .build();
