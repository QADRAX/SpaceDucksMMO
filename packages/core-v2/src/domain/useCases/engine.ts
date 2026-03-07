import type { EngineState } from '../engine';
import type { EngineUseCase, BoundUseCase } from './types';
import { bindUseCase } from './bind';

/**
 * Defines an engine use case, automatically tagging it with `domain: 'engine'`.
 */
export function defineEngineUseCase<TParams = void, TOutput = void>(
  definition: Omit<EngineUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
    readonly guards?: EngineUseCase<TParams, TOutput>['guards'];
  },
): EngineUseCase<TParams, TOutput> {
  return { ...definition, guards: definition.guards ?? [], domain: 'engine' };
}

/** Binds an EngineUseCase to a concrete EngineState. */
export function bindEngineUseCase<TParams, TOutput>(
  state: EngineState,
  useCase: EngineUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
  return bindUseCase(state, useCase);
}
