import type { ViewportState } from '../../domain/types/viewport';
import type { EngineState } from '../../domain/types/engineState';
import type { UseCase, UseCaseGuard } from '../../domain/types/useCase';
import type { BoundUseCase } from '../useCase';
import { bindUseCase } from '../useCase';

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
 *
 * Guards declared here are cross-domain preconditions that the DI layer
 * (composer) runs automatically before `execute`. Think `@PreAuthorize`.
 *
 * @example
 * ```ts
 * export const setViewportScene = defineViewportUseCase<SetViewportSceneParams, void>({
 *   name: 'setViewportScene',
 *   guards: [guardSceneExists],
 *   execute(viewport, { sceneId }) { viewport.sceneId = sceneId; },
 * });
 * ```
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
