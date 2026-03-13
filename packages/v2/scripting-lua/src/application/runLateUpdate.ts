import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { runHookOnAllSlots } from '../domain/slots';

/** lateUpdate phase: run lateUpdate hook. */
export const runLateUpdate: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runLateUpdate',
    execute(session, { dt }) {
      runHookOnAllSlots(session.slots, session.sandbox, 'lateUpdate', dt);
    },
  });
