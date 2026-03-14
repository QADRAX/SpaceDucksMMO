import type { SceneState } from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { World } from '@dimforge/rapier3d-compat';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Internal physics world state (Rapier World, bodies, colliders, events).
 * Implemented by infrastructure; implements PhysicsWorldHandle for use cases.
 */
export interface PhysicsWorldState extends PhysicsWorldHandle {
  addEntity(scene: SceneState, entity: EntityState): void;
  removeEntity(scene: SceneState, entityId: string): void;
  step(scene: SceneState, dt: number): void;
  syncEntity(scene: SceneState, entityId: string): void;
  dispose(): void;
  /** Rapier world (for raycast, etc.). */
  world: World;
  /** Collision events handle (for getCollisionEvents and raycast hit resolution). */
  collisions: {
    getAccumulatedEvents(): import('@duckengine/core-v2').PhysicsCollisionEvent[];
    clearAccumulatedEvents(): void;
    getBodyOwnerIdFromHandle?(handle: number): string | undefined;
  };
}
