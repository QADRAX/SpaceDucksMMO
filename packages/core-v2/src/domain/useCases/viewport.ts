import type { ViewportUseCase, ViewportGuard } from './types';

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
