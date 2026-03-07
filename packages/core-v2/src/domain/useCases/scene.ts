import type {  SceneState  } from '../types/../scene';
import type { UseCase } from './types';
import type { BoundUseCase } from './types';
import { bindUseCase } from './bind';

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
