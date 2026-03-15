import {
  type ResourceRef,
  type SubsystemEngineEventParams,
  type TrimeshColliderComponent,
  getComponent,
  isResourceRef,
} from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Reconciles pending physics (e.g. trimesh colliders) when a mesh resource is loaded.
 * When mesh/collider components reference resources not yet in cache, they are deferred.
 * This use case re-syncs affected entities when the mesh loads.
 */
export const reconcilePendingPhysicsForKey = {
  name: 'physics/reconcilePendingPhysicsForKey',
  execute(state: PhysicsWorldHandle, params: SubsystemEngineEventParams): void {
    if (params.event.kind !== 'resource-loaded' || params.event.ref.kind !== 'mesh') return;
    if (!params.scene) return;

    const loadedMeshRef = params.event.ref as ResourceRef<'mesh'>;
    for (const entity of params.scene.entities.values()) {
      const tc = getComponent<TrimeshColliderComponent>(entity, 'trimeshCollider');
      if (tc?.mesh && isResourceRef(tc.mesh) && tc.mesh.key === loadedMeshRef.key) {
        state.syncEntity(params.scene, entity.id);
      }
    }
  },
};
