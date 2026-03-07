import type { UseCase } from '../domain/types/useCase';

/**
 * A use case whose state has been pre-bound.
 * Created by `bindUseCase` — callers only supply params.
 */
export interface BoundUseCase<TParams, TOutput> {
  readonly name: string;
  readonly domain: string;
  execute(params: TParams): TOutput;
}

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
