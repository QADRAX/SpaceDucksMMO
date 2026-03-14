import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase, isPhysicsRelatedComponentType } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Re-syncs an entity in the physics world when a physics-related component changes.
 */
export const onComponentChangedPhysics = defineSubsystemEventUseCase<
  PhysicsWorldHandle,
  SubsystemEventParams,
  void
>({
  name: 'physics/onComponentChangedPhysics',
  event: 'component-changed',

  execute(state, params) {
    if (params.event.kind !== 'component-changed') return;
    if (!isPhysicsRelatedComponentType(params.event.componentType)) return;
    state.syncEntity(params.scene, params.event.entityId);
  },
});
