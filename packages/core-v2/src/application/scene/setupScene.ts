import type { SceneSystemAdapter } from '../../domain/scene';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';
import { attachSceneAdapters } from '../../domain/adapters';

/** Parameters for the setupScene use case. */
export interface SetupSceneParams {
  readonly adapters?: ReadonlyArray<SceneSystemAdapter>;
}

/**
 * Registers scene system adapters and signals that the scene is ready.
 *
 * Each adapter is stored in `scene.adapters` (update-pipeline order)
 * and wrapped in a `SceneChangeListener` for reactive events.
 * `teardownScene` detaches listeners and calls `dispose()`.
 */
export const setupScene = defineSceneUseCase<SetupSceneParams, void>({
  name: 'setupScene',
  execute(scene, { adapters }) {
    if (adapters) {
      attachSceneAdapters(scene, adapters);
    }

    emitSceneChange(scene, { kind: 'scene-setup' });
  },
});
