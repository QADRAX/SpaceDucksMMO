import type { ScriptingSessionState } from '../domain/session';
import type { ScriptingUseCase } from '../domain/useCases';
import { defineScriptingUseCase } from '../domain/useCases';
import { destroyEntityScriptSlots } from '../domain/slots';

export interface DestroyEntitySlotsParams {
  readonly entityId: string;
}

/**
 * Destroys all script slots belonging to a given entity.
 *
 * Called when an entity is removed from the scene.
 * Runs `onDisable` → `onDestroy` lifecycle on each slot,
 * then cleans up sandbox and event bus subscriptions.
 */
export const destroyEntitySlots: ScriptingUseCase<DestroyEntitySlotsParams, void> =
  defineScriptingUseCase<DestroyEntitySlotsParams, void>({
    name: 'scripting/destroyEntitySlots',

    execute(session: ScriptingSessionState, params: DestroyEntitySlotsParams): void {
      const { entityId } = params;
      destroyEntityScriptSlots(session.slots, session.sandbox, session.eventBus, entityId);
    },
  });
