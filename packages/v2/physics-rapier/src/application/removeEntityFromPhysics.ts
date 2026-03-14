import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Removes an entity from the physics world when entity-removed fires.
 */
export const removeEntityFromPhysics = defineSubsystemEventUseCase<
  PhysicsWorldHandle,
  SubsystemEventParams,
  void
>({
  name: 'physics/removeEntityFromPhysics',
  event: 'entity-removed',

  execute(state, params) {
    if (params.event.kind !== 'entity-removed') return;
    state.removeEntity(params.scene, params.event.entityId);
  },
});
