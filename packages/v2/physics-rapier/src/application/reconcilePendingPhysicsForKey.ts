import type { SubsystemEngineEventParams } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Reconciles pending physics (e.g. trimesh colliders) when a mesh resource is loaded.
 * When mesh/collider components reference resources not yet in cache, they are deferred.
 * This use case re-syncs affected entities when the mesh loads.
 *
 * Currently Rapier supports only primitive colliders (sphere, box, etc.).
 * Placeholder for future trimeshCollider support — no-op until then.
 */
export const reconcilePendingPhysicsForKey = {
  name: 'physics/reconcilePendingPhysicsForKey',
  execute(_state: PhysicsWorldHandle, params: SubsystemEngineEventParams): void {
    if (params.event.kind !== 'resource-loaded' || params.event.ref.kind !== 'mesh') return;
    if (!params.scene) return;

    // TODO: When trimeshCollider is added, find entities with that mesh ref and syncEntity each.
  },
};
