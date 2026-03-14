import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Adds an entity (and its subtree) to the physics world when entity-added fires.
 */
export const addEntityToPhysics = defineSubsystemEventUseCase<
  PhysicsWorldHandle,
  SubsystemEventParams,
  void
>({
  name: 'physics/addEntityToPhysics',
  event: 'entity-added',

  execute(state, params) {
    if (params.event.kind !== 'entity-added') return;
    const entity = params.scene.entities.get(params.event.entityId);
    if (entity == null) return;
    state.addEntity(params.scene, entity);
  },
});
