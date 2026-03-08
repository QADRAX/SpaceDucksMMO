import type { BoundUseCase } from '@duckengine/core-v2';
import { bindUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../session';
import type { ScriptingUseCase } from './types';

/**
 * Defines a scripting use case, automatically tagging it with `domain: 'scripting'`.
 */
export function defineScriptingUseCase<TParams = void, TOutput = void>(
  definition: Omit<ScriptingUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
    readonly guards?: ScriptingUseCase<TParams, TOutput>['guards'];
  },
): ScriptingUseCase<TParams, TOutput> {
  return { ...definition, guards: definition.guards ?? [], domain: 'scripting' };
}

/** Binds a ScriptingUseCase to a concrete ScriptingSessionState. */
export function bindScriptingUseCase<TParams, TOutput>(
  session: ScriptingSessionState,
  useCase: ScriptingUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
  return bindUseCase(session, useCase);
}
