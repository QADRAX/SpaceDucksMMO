import type { UseCase, BoundUseCase } from './types';

/** Binds a use case to a concrete state, returning a BoundUseCase. */
export function bindUseCase<TState, TParams, TOutput>(
    state: TState,
    useCase: UseCase<TState, TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
    return {
        name: useCase.name,
        domain: useCase.domain,
        execute: (params: TParams) => useCase.execute(state, params),
    };
}
