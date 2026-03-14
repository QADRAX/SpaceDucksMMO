import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase, PHYSICS_RELATED_COMPONENT_TYPES } from '@duckengine/core-v2';
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
    if (!PHYSICS_RELATED_COMPONENT_TYPES.includes(params.event.componentType)) return;
    state.syncEntity(params.scene, params.event.entityId);
  },
});
