import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';

/**
 * Tears down the entire scripting session.
 *
 * Runs `onDisable` → `onDestroy` lifecycle on every active slot,
 * clears the slot map, and disposes the event bus.
 *
 * Does NOT dispose the sandbox — that's the subsystem's responsibility
 * (the sandbox may be shared or externally owned).
 *
 * Can be called from either `scene-teardown` event or `dispose` hook.
 * Params are optional to support both contexts.
 */
export const teardownSession =
  defineSubsystemEventUseCase<ScriptingSessionState, SubsystemEventParams | void, void>({
    name: 'scripting/teardownSession',
    event: 'scene-teardown',

    execute(session: ScriptingSessionState, _params?: SubsystemEventParams | void): void {
      const { slots, sandbox, eventBus } = session;

      for (const [key, slot] of slots) {
        if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
        sandbox.callHook(key, 'onDestroy', 0);
        sandbox.destroySlot(key);
      }

      slots.clear();
      eventBus.dispose();
    },
  });
