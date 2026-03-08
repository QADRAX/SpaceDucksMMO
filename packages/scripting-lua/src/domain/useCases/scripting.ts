import { defineAdapterUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';
import type { ScriptingUseCase } from './types';
import type { SceneChangeEventWithError } from '@duckengine/core-v2';

/**
 * Defines a scripting use case using the adapter use case pattern.
 * 
 * This is a convenience wrapper around `defineAdapterUseCase` that
 * pre-binds the `ScriptingSessionState` type.
 */
export function defineScriptingUseCase<TParams = void, TOutput = void>(
  definition: ScriptingUseCase<TParams, TOutput>,
): ScriptingUseCase<TParams, TOutput> {
  return defineAdapterUseCase<ScriptingSessionState, TParams, TOutput>(definition);
}

/**
 * Defines a scripting use case that is tied to a specific scene event.
 * The returned value keeps the `event` metadata so adapters can auto-register it.
 */
export function defineScriptingEventUseCase<
  TParams = void,
  TOutput = void,
>(
  definition: ScriptingUseCase<TParams, TOutput> & { readonly event: SceneChangeEventWithError['kind'] },
): ScriptingUseCase<TParams, TOutput> & { readonly event: SceneChangeEventWithError['kind'] } {
  // Adapter use case runtime doesn't care about the extra `event` property,
  // so cast through `any` to allow the metadata to flow while keeping runtime shape.
  return defineAdapterUseCase<ScriptingSessionState, TParams, TOutput>(definition as any) as any;
}
