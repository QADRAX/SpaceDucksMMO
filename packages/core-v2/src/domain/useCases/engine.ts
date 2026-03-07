import type {  EngineState  } from '../types/../engine';
import type { UseCase } from './types';
import type { BoundUseCase } from './types';
import { bindUseCase } from './bind';

/**
 * A use case that operates on an EngineState.
 * Tagged with `domain: 'engine'` for runtime and compile-time discrimination.
 */
export interface EngineUseCase<TParams = void, TOutput = void>
    extends UseCase<EngineState, TParams, TOutput> {
    readonly domain: 'engine';
}

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
