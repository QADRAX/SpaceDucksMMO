import { defineSceneUseCase } from '../../domain/useCases';
import { guardEngineSetupComplete } from '../../domain/engine/engineGuards';

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
  guards: [guardEngineSetupComplete],
  execute(scene, { dt }) {
    for (const subsystem of scene.subsystems) {
      if (scene.paused && !subsystem.updateWhenPaused) continue;
      subsystem.update?.(scene, dt);
    }
  },
});
