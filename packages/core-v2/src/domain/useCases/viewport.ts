import type {  ViewportState  } from '../types/../viewport';
import type {  EngineState  } from '../types/../engine';
import type { UseCase, UseCaseGuard } from './types';
import type { BoundUseCase } from './types';
import { bindUseCase } from './bind';

/**
 * A use case that operates on a ViewportState.
 * Tagged with `domain: 'viewport'` for runtime and compile-time discrimination.
 */
export interface ViewportUseCase<TParams = void, TOutput = void>
    extends UseCase<ViewportState, TParams, TOutput> {
    readonly domain: 'viewport';
}

/** Concrete guard type for viewport use cases. */
export type ViewportGuard<TParams> = UseCaseGuard<EngineState, ViewportState, TParams>;

/**
 * Defines a viewport use case, automatically tagging it with `domain: 'viewport'`.
 */
export function defineViewportUseCase<TParams = void, TOutput = void>(
    definition: Omit<ViewportUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
        readonly guards?: ReadonlyArray<ViewportGuard<TParams>>;
    },
): ViewportUseCase<TParams, TOutput> {
    return {
        ...definition,
        guards: definition.guards ?? [],
        domain: 'viewport',
    };
}

/** Binds a ViewportUseCase to a concrete ViewportState. */
export function bindViewportUseCase<TParams, TOutput>(
    state: ViewportState,
    useCase: ViewportUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
    return bindUseCase(state, useCase);
}
