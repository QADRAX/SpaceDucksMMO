import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase, removeEntityFromScene } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { flushDirtySlotsToScene } from '../domain/slots';

/** postRender phase: flush dirty Lua→ECS, process pending destroys. */
export const runPostRender: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runPostRender',
    execute(session, { scene }) {
      const { slots, sandbox } = session;

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

      const pending = session.pendingDestroys;
      if (pending.length > 0) {
        for (const entityId of pending) {
          removeEntityFromScene.execute(scene, { entityId });
        }
        pending.length = 0;
      }
    },
  });
