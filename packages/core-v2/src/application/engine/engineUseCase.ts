import type { EngineState } from '../../domain/types/engineState';
import type { UseCase } from '../../domain/types/useCase';
import type { BoundUseCase } from '../useCase';
import { bindUseCase } from '../useCase';

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
  definition: Omit<EngineUseCase<TParams, TOutput>, 'domain'>,
): EngineUseCase<TParams, TOutput> {
  return { ...definition, domain: 'engine' };
}

/** Binds an EngineUseCase to a concrete EngineState. */
export function bindEngineUseCase<TParams, TOutput>(
  state: EngineState,
  useCase: EngineUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
  return bindUseCase(state, useCase);
}
