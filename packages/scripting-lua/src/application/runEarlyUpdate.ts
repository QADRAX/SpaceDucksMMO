import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase, emitSceneChange } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { runHookOnAllSlots, syncSlotPropertiesFromScene } from '../domain/slots';
import { createComponentAccessorPair } from '../domain/componentAccessors';

/** earlyUpdate phase: time state, sync ECS→Lua, event bus flush, earlyUpdate hook. */
export const runEarlyUpdate: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runEarlyUpdate',
    execute(session, { scene, dt }) {
      const { slots, sandbox, eventBus, timeState } = session;

      if (sandbox.bindScriptErrorReporter) {
        sandbox.bindScriptErrorReporter(({ slotKey, phase, hookName, message }) => {
          emitSceneChange(scene, { kind: 'script-error', slotKey, phase, hookName, message });
        });
      }

      timeState.delta = dt;
      timeState.elapsed += dt;
      timeState.frameCount++;

      if (sandbox.bindComponentAccessors) {
        const { getter, setter } = createComponentAccessorPair(scene);
        sandbox.bindComponentAccessors(getter, setter);
      }

      for (const slot of slots.values()) {
        if (!slot.enabled) continue;
        syncSlotPropertiesFromScene(scene, slot, sandbox);
      }

      runHookOnAllSlots(slots, sandbox, 'earlyUpdate', dt);
      eventBus.flush();
    },
  });
