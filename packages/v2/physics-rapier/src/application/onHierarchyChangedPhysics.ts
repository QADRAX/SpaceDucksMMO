import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Re-syncs an entity subtree when hierarchy changes (reparent).
 * Needed because collider attachment and joint local frames depend on parent chain.
 */
export const onHierarchyChangedPhysics = defineSubsystemEventUseCase<
  PhysicsWorldHandle,
  SubsystemEventParams,
  void
>({
  name: 'physics/onHierarchyChangedPhysics',
  event: 'hierarchy-changed',

  execute(state, params) {
    if (params.event.kind !== 'hierarchy-changed') return;
    const root = params.scene.entities.get(params.event.childId);
    if (!root) return;

    const stack = [root];
    while (stack.length > 0) {
      const e = stack.pop()!;
      state.syncEntity(params.scene, e.id);
      for (const ch of e.children) stack.push(ch);
    }
  },
});

