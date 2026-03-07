import { defineSceneUseCase } from '../../domain/useCases';

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
      if (scene.paused && !adapter.updateWhenPaused) continue;
      adapter.update?.(scene, dt);
    }
  },
});
