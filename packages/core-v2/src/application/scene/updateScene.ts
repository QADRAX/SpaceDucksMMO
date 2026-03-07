import { defineSceneUseCase } from './sceneUseCase';

/** Parameters for the updateScene use case. */
export interface UpdateSceneParams {
  readonly dt: number;
}

/**
 * Advances the scene by one frame.
 *
 * Iterates registered adapters in pipeline order and calls
 * `adapter.update(scene, dt)` synchronously. This guarantees
 * deterministic execution: physics steps before render, etc.
 */
export const updateScene = defineSceneUseCase<UpdateSceneParams, void>({
  name: 'updateScene',
  execute(scene, { dt }) {
    for (const adapter of scene.adapters) {
      adapter.update?.(scene, dt);
    }
  },
});
