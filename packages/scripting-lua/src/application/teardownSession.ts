import type { ScriptingSessionState } from '../domain/session';
import type { ScriptingUseCase } from '../domain/useCases';
import { defineScriptingUseCase } from '../domain/useCases';

/**
 * Tears down the entire scripting session.
 *
 * Runs `onDisable` → `onDestroy` lifecycle on every active slot,
 * clears the slot map, and disposes the event bus.
 *
 * Does NOT dispose the sandbox — that's the adapter's responsibility
 * (the sandbox may be shared or externally owned).
 */
export const teardownSession: ScriptingUseCase<void, void> =
  defineScriptingUseCase<void, void>({
    name: 'scripting/teardownSession',

    execute(session: ScriptingSessionState): void {
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
