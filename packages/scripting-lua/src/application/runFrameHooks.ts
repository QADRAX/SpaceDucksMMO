import type { EntityId, SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase, removeEntityFromScene, emitSceneChange } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import {
  FRAME_HOOKS,
  runHookOnAllSlots,
  syncSlotPropertiesFromScene,
  flushDirtySlotsToScene,
} from '../domain/slots';
import { createComponentAccessorPair } from '../domain/componentAccessors';

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
export const runFrameHooks: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runFrameHooks',

    execute(session: ScriptingSessionState, params: SubsystemUpdateParams): void {
      const { scene, dt } = params;
      const { slots, sandbox, eventBus, timeState } = session;

      if (sandbox.bindScriptErrorReporter) {
        sandbox.bindScriptErrorReporter(({ slotKey, phase, hookName, message }) => {
          emitSceneChange(scene, { kind: 'script-error', slotKey, phase, hookName, message });
        });
      }

      // 1. Update time state
      timeState.delta = dt;
      timeState.elapsed += dt;
      timeState.frameCount++;

      if (sandbox.bindComponentAccessors) {
        const { getter, setter } = createComponentAccessorPair(scene);
        sandbox.bindComponentAccessors(getter, setter);
      }

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
      for (const slot of slots.values()) {
        if (!slot.enabled || !slot.sandboxHandle) continue;
        const dirty = sandbox.flushDirtyProperties(slot.sandboxHandle as string);
        if (dirty) {
          for (const [key, value] of Object.entries(dirty)) {
            slot.properties[key] = value;
            slot.dirtyKeys.add(key);
          }
        }
      }
      flushDirtySlotsToScene(slots, scene);

      // 7. Process pending entity destroys (from Scene.destroy)
      const pending = session.pendingDestroys;
      if (pending.length > 0) {
        for (const id of pending) {
          removeEntityFromScene.execute(scene, { entityId: id as EntityId });
        }
        pending.length = 0;
      }
    },
  });
