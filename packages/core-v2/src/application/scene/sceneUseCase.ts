import type { SceneState } from '../../domain/types/sceneState';
import type { UseCase } from '../../domain/types/useCase';
import type { BoundUseCase } from '../useCase';
import { bindUseCase } from '../useCase';

/**
 * A use case that operates on a SceneState.
 * Tagged with `domain: 'scene'` for runtime and compile-time discrimination.
 */
export interface SceneUseCase<TParams = void, TOutput = void>
  extends UseCase<SceneState, TParams, TOutput> {
  readonly domain: 'scene';
}

/**
 * Defines a scene use case, automatically tagging it with `domain: 'scene'`.
 * @example
 * ```ts
 * export const addEntity = defineSceneUseCase<AddEntityParams, Result<void>>({
 *   name: 'addEntityToScene',
 *   execute(scene, { entity }) { ... },
 * });
 * ```
 */
export function defineSceneUseCase<TParams = void, TOutput = void>(
  definition: Omit<SceneUseCase<TParams, TOutput>, 'domain'>,
): SceneUseCase<TParams, TOutput> {
  return { ...definition, domain: 'scene' };
}

/** Binds a SceneUseCase to a concrete SceneState. */
export function bindSceneUseCase<TParams, TOutput>(
  scene: SceneState,
  useCase: SceneUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
  return bindUseCase(scene, useCase);
}
