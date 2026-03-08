import type { SceneUseCase } from './types';

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
