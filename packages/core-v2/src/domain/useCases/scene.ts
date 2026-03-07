import type { SceneState } from '../scene';
import type { SceneUseCase, BoundUseCase } from './types';
import { bindUseCase } from './bind';

/**
 * Defines a scene use case, automatically tagging it with `domain: 'scene'`.
 */
export function defineSceneUseCase<TParams = void, TOutput = void>(
  definition: Omit<SceneUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
    readonly guards?: SceneUseCase<TParams, TOutput>['guards'];
  },
): SceneUseCase<TParams, TOutput> {
  return { ...definition, guards: definition.guards ?? [], domain: 'scene' };
}

/** Binds a SceneUseCase to a concrete SceneState. */
export function bindSceneUseCase<TParams, TOutput>(
  scene: SceneState,
  useCase: SceneUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
  return bindUseCase(scene, useCase);
}
