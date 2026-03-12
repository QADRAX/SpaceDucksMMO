import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { runHookOnAllSlots } from '../domain/slots';

/** preRender phase: run onDrawGizmos hook. */
export const runPreRender: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runPreRender',
    execute(session, { dt }) {
      runHookOnAllSlots(session.slots, session.sandbox, 'onDrawGizmos', dt);
    },
  });
