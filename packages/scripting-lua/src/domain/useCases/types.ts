import type { UseCase, UseCaseGuard } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';

/**
 * A use case that operates on a ScriptingSessionState.
 * Tagged with `domain: 'scripting'` for runtime and compile-time discrimination.
 */
export interface ScriptingUseCase<TParams = void, TOutput = void> extends UseCase<
  ScriptingSessionState,
  TParams,
  TOutput
> {
  readonly domain: 'scripting';
}

/** Concrete guard type for scripting use cases (root = session). */
export type ScriptingGuard<TParams> = UseCaseGuard<
  ScriptingSessionState,
  ScriptingSessionState,
  TParams
>;
