import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { runHookOnAllSlots } from '../domain/slots';

/** update phase: run update hook. */
export const runUpdate: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runUpdate',
    execute(session, { dt }) {
      runHookOnAllSlots(session.slots, session.sandbox, 'update', dt);
    },
  });
