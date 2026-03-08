import type { AdapterUpdateParams, AdapterUseCase } from '@duckengine/core-v2';
import { defineAdapterUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import {
  FRAME_HOOKS,
  runHookOnAllSlots,
  syncSlotPropertiesFromScene,
  flushDirtySlotsToScene,
} from '../domain/slots';

/**
 * Executes the per-frame hook pipeline for all enabled slots.
 *
 * Order:
 * 1. Update time state
 * 2. Sync ECS → Lua properties (delegated to syncProperties use case externally before this)
 * 3. Run `earlyUpdate` on all slots
 * 4. Flush event bus (delivers queued events)
 * 5. Run remaining frame hooks (`update`, `lateUpdate`, `onDrawGizmos`)
 * 6. Flush dirty properties (Lua → ECS)
 *
 * If a hook call fails, the slot is automatically disabled.
 */
export const runFrameHooks: AdapterUseCase<ScriptingSessionState, AdapterUpdateParams, void> =
  defineAdapterUseCase<ScriptingSessionState, AdapterUpdateParams, void>({
    name: 'scripting/runFrameHooks',

    execute(session: ScriptingSessionState, params: AdapterUpdateParams): void {
      const { scene, dt } = params;
      const { slots, sandbox, eventBus, timeState } = session;

      // 1. Update time state
      timeState.delta = dt;
      timeState.elapsed += dt;
      timeState.frameCount++;

      // 2. Sync properties (ECS → Lua) for all enabled slots
      for (const slot of slots.values()) {
        if (!slot.enabled) continue;
        syncSlotPropertiesFromScene(scene, slot, sandbox);
      }

      // 3. earlyUpdate
      runHookOnAllSlots(slots, sandbox, 'earlyUpdate', dt);

      // 4. Flush event bus
      eventBus.flush();

      // 5. Remaining frame hooks
      for (const hook of FRAME_HOOKS) {
        if (hook === 'earlyUpdate') continue;
        runHookOnAllSlots(slots, sandbox, hook, dt);
      }

      // 6. Flush dirty properties (Lua → ECS)
      flushDirtySlotsToScene(slots, scene);
    },
  });
