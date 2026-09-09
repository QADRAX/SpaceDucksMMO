import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase, isPhysicsRelatedComponentType } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Re-syncs an entity (and subtree when transform3d toggles) in the physics world.
 * `transform3d` enable/disable = leave/re-enter space → remove or recreate rigid body.
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

    const root = params.scene.entities.get(params.event.entityId);
    if (!root) return;

    // Pose participation changes affect joints/colliders down the hierarchy.
    if (params.event.componentType === 'transform3d') {
      const stack = [root];
      while (stack.length > 0) {
        const e = stack.pop()!;
        state.syncEntity(params.scene, e.id);
        for (const ch of e.children) stack.push(ch);
      }
      return;
    }

    state.syncEntity(params.scene, params.event.entityId);
  },
});
