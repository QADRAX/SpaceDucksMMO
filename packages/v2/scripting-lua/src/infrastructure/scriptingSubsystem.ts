import { createSceneSubsystem } from '@duckengine/core-v2';
import { createScriptingSessionState } from './createScriptingSessionState';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import {
  runEarlyUpdate,
  runUpdate,
  runLateUpdate,
  runPreRender,
  runPostRender,
} from '../application';
import { teardownSession } from '../application/teardownSession';
import { createWasmoonSandbox } from './wasmoon';

/**
 * Creates the scene subsystem factory for Lua scripting.
 *
 * Uses the flat createSceneSubsystem config to wire ports, session state,
 * and lifecycle use cases. Ports are resolved from ctx.ports (same as physics/rendering).
 */
export async function createScriptingSubsystem() {
  const { sandbox, engine } = await createWasmoonSandbox();

  return createSceneSubsystem({
    id: 'scripting-lua',
    createState: (ctx) => createScriptingSessionState(ctx, sandbox, engine),
    events: {
      'component-changed': reconcileSlots,
      'entity-removed': destroyEntitySlots,
      'scene-teardown': teardownSession,
    },
    phases: {
      earlyUpdate: runEarlyUpdate,
      update: runUpdate,
      lateUpdate: runLateUpdate,
      preRender: runPreRender,
      postRender: runPostRender,
    },
    dispose: teardownSession,
  });
}
