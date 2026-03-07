import type { Vec3Like } from '../types/math';
import type { PhysicsRay, PhysicsRaycastHit, PhysicsCollisionEvent } from '../types/physics';
import type { EntityState } from '../ecs/entity';

/**
 * Contract for physics simulation backends.
 * Implementations live in physics packages (e.g. @duckengine/physics-rapier).
 */
export interface PhysicsPort {
  /** Initialise the physics world with an optional gravity vector. */
  init(gravity?: Vec3Like): void;
  /** Destroy the physics world and release all resources. */
  destroy(): void;
  /** Register an entity's rigid bodies and colliders. */
  addEntity(entity: EntityState): void;
  /** Remove an entity from the simulation. */
  removeEntity(entityId: string): void;
  /** Advance the simulation by `dt` seconds. */
  step(dt: number): void;
  /** Cast a ray and return the first hit, or null. */
  raycast(ray: PhysicsRay): PhysicsRaycastHit | null;
  /** Drain collision events accumulated during the last step. */
  getCollisionEvents(): PhysicsCollisionEvent[];
}
