import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { createScene } from '../../domain/scene/createScene';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the addSceneToEngine use case. */
export interface AddSceneParams {
  readonly sceneId: string;
}

/**
 * Creates a new scene and registers it in the engine.
 * Fails if a scene with the same id already exists.
 */
export const addSceneToEngine = defineEngineUseCase<AddSceneParams, Result<void>>({
  name: 'addSceneToEngine',
  execute(engine, { sceneId }) {
    if (engine.scenes.has(sceneId)) {
      return err('validation', `Scene '${sceneId}' already exists.`);
    }

    const scene = createScene(sceneId);
    engine.scenes.set(sceneId, scene);

    return ok(undefined);
  },
});
