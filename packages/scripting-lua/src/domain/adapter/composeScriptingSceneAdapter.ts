import type { AdapterEventParams, AdapterUpdateParams, SceneSystemAdapter } from '@duckengine/core-v2';
import { composeAdapter } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';
import type { ScriptingUseCase } from '../useCases';

export interface ComposeScriptingSceneAdapterParams {
  readonly session: ScriptingSessionState;
  readonly reconcileSlots: ScriptingUseCase<AdapterEventParams, void>;
  readonly destroyEntitySlots: ScriptingUseCase<AdapterEventParams, void>;
  readonly runFrameHooks: ScriptingUseCase<AdapterUpdateParams, void>;
  readonly teardownSession: ScriptingUseCase<AdapterEventParams | void, void>;
}

/**
 * Composes a SceneSystemAdapter from session state and scripting use cases.
 */
export function composeScriptingSceneAdapter(
  params: ComposeScriptingSceneAdapterParams,
): SceneSystemAdapter {
  return composeAdapter(params.session)
    .on('component-changed', params.reconcileSlots)
    .on('entity-removed', params.destroyEntitySlots)
    .on('scene-teardown', params.teardownSession)
    .onUpdate(params.runFrameHooks)
    .onDispose(params.teardownSession)
    .build();
}
