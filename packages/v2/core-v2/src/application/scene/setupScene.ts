import type { SceneSubsystem } from '../../domain/subsystems';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';
import { attachSceneSubsystems } from '../../domain/subsystems';

/** Parameters for the setupScene use case. */
export interface SetupSceneParams {
  readonly subsystems?: ReadonlyArray<SceneSubsystem>;
}

/**
 * Registers scene system subsystems and signals that the scene is ready.
 *
 * Each subsystem is stored in `scene.subsystems` (update-pipeline order)
 * and wrapped in a `SceneChangeListener` for reactive events.
 * `teardownScene` detaches listeners and calls `dispose()`.
 */
export const setupScene = defineSceneUseCase<SetupSceneParams, void>({
  name: 'setupScene',
  execute(scene, { subsystems }) {
    if (subsystems) {
      attachSceneSubsystems(scene, subsystems);
    }

    emitSceneChange(scene, { kind: 'scene-setup' });
  },
});
