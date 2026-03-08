import type { AdapterEventParams, AdapterUpdateParams, SceneSystemAdapter, SceneChangeEventWithError } from '@duckengine/core-v2';
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
  const composer = composeAdapter(params.session);

  const registerEventUseCase = (
    useCase: ScriptingUseCase<AdapterEventParams, void> | ScriptingUseCase<AdapterEventParams | void, void>,
  ) => {
    const eventKind = (useCase as any).event as SceneChangeEventWithError['kind'] | undefined;
    if (eventKind) composer.on(eventKind, useCase as any);
    return composer;
  };

  registerEventUseCase(params.reconcileSlots);
  registerEventUseCase(params.destroyEntitySlots);
  registerEventUseCase(params.teardownSession);

  return composer.onUpdate(params.runFrameHooks).onDispose(params.teardownSession).build();
}
