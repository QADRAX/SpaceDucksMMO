import type { PhysicsRay, PhysicsRaycastHit, PhysicsCollisionEvent } from '../types/physics';

/**
 * Query-only contract for physics backends.
 *
 * Lifecycle operations (init, destroy, addEntity, removeEntity, step)
 * are handled by the physics `SceneSystemAdapter` reacting to scene
 * events. This port exposes only the query methods that use cases or
 * scripting code may call at any time.
 */
export interface PhysicsQueryPort {
  /** Cast a ray and return the first hit, or null. */
  raycast(ray: PhysicsRay): PhysicsRaycastHit | null;
  /** Drain collision events accumulated during the last step. */
  getCollisionEvents(): PhysicsCollisionEvent[];
}
