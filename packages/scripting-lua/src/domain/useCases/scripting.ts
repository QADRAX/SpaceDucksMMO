import { defineAdapterUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';
import type { ScriptingUseCase } from './types';

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
