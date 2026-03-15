import type { SceneState } from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { DiagnosticPort } from '@duckengine/core-v2';
import type { World } from '@dimforge/rapier3d-compat';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Internal physics world state (Rapier World, bodies, colliders, events).
 * Implemented by infrastructure; implements PhysicsWorldHandle for use cases.
 * Logging must go through diagnostic port; do not use console.*.
 */
export interface PhysicsWorldState extends PhysicsWorldHandle {
  /** Optional diagnostic port from engine; use for all logging. */
  diagnostic?: DiagnosticPort;
  addEntity(scene: SceneState, entity: EntityState): void;
  removeEntity(scene: SceneState, entityId: string): void;
  step(scene: SceneState, dt: number): void;
  syncEntity(scene: SceneState, entityId: string): void;
  teleportBody(entityId: string, worldPos: { x: number; y: number; z: number }): void;
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
