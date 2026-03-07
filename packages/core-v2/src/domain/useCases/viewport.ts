import type { ViewportState } from '../viewport';
import type { ViewportUseCase, ViewportGuard, BoundUseCase } from './types';
import { bindUseCase } from './bind';

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
