import type { AdapterUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';

/**
 * A use case that operates on a ScriptingSessionState.
 * Adapter use cases participate in the scene lifecycle via `composeAdapter`.
 */
export type ScriptingUseCase<TParams = void, TOutput = void> = AdapterUseCase<
  ScriptingSessionState,
  TParams,
  TOutput
>;
