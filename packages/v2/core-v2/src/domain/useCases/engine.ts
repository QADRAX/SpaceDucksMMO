import type { EngineUseCase } from './types';

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
