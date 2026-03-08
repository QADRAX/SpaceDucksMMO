import type { AdapterEventParams } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import type { ScriptingUseCase } from '../domain/useCases';
import { defineScriptingUseCase } from '../domain/useCases';
import { destroyEntityScriptSlots } from '../domain/slots';

/**
 * Destroys all script slots belonging to a given entity.
 *
 * Called when an entity is removed from the scene.
 * Runs `onDisable` → `onDestroy` lifecycle on each slot,
 * then cleans up sandbox and event bus subscriptions.
 */
export const destroyEntitySlots: ScriptingUseCase<AdapterEventParams, void> =
  defineScriptingUseCase<AdapterEventParams, void>({
    name: 'scripting/destroyEntitySlots',

    execute(session: ScriptingSessionState, params: AdapterEventParams): void {
      const { event } = params;
      
      // Only handle entity-removed events
      if (event.kind !== 'entity-removed') return;
      
      const { entityId } = event;
      destroyEntityScriptSlots(session.slots, session.sandbox, session.eventBus, entityId);
    },
  });
