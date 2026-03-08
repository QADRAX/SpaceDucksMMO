import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { destroyEntityScriptSlots } from '../domain/slots';

/**
 * Destroys all script slots belonging to a given entity.
 *
 * Called when an entity is removed from the scene.
 * Runs `onDisable` → `onDestroy` lifecycle on each slot,
 * then cleans up sandbox and event bus subscriptions.
 */
export const destroyEntitySlots =
  defineSubsystemEventUseCase<ScriptingSessionState, SubsystemEventParams, void>({
    name: 'scripting/destroyEntitySlots',
    event: 'entity-removed',

    execute(session: ScriptingSessionState, params: SubsystemEventParams): void {
      // The builder handles event.kind routing automatically.
      const event = params.event as any;

      const { entityId } = event;
      destroyEntityScriptSlots(session.slots, session.sandbox, session.eventBus, entityId);
    },
  });
