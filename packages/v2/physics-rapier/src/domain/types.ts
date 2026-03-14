import type { PhysicsTimestepConfig } from '@duckengine/core-v2';
import type { SceneState, EntityState } from '@duckengine/core-v2';

/**
 * Timestep and fixed-step config for the physics world.
 */
export interface PhysicsWorldConfig {
  readonly timestep: PhysicsTimestepConfig;
}

/**
 * Handle to the physics world for use cases. Infrastructure implements this.
 * Domain defines the contract so application does not depend on infra.
 */
export interface PhysicsWorldHandle {
  addEntity(scene: SceneState, entity: EntityState): void;
  removeEntity(scene: SceneState, entityId: string): void;
  step(scene: SceneState, dt: number): void;
  /** Re-sync a single entity's body/colliders after component change. */
  syncEntity(scene: SceneState, entityId: string): void;
  /** Release world and bodies; called when the scene is disposed. */
  dispose(): void;
}
