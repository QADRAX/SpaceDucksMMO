import type { SceneState } from '../../domain/scene';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { createScene } from '../../domain/scene/createScene';
import { defineEngineUseCase } from '../../domain/useCases';
import {
  attachSceneAdapters,
  instantiateSceneAdapters,
  runAdapterPortDerivers,
} from '../../domain/adapters';

/** Parameters for the addSceneToEngine use case. */
export interface AddSceneParams {
  readonly sceneId: string;
}

/**
 * Creates a new scene and registers it in the engine.
 * Fails if a scene with the same id already exists.
 * Returns the created SceneState on success.
 */
export const addSceneToEngine = defineEngineUseCase<AddSceneParams, Result<SceneState>>({
  name: 'addSceneToEngine',
  execute(engine, { sceneId }) {
    if (engine.scenes.has(sceneId)) {
      return err('validation', `Scene '${sceneId}' already exists.`);
    }

    const scene = createScene(sceneId);
    engine.scenes.set(sceneId, scene);

    // Engine-level scene adapter factories are applied automatically to each new scene.
    runAdapterPortDerivers(engine);
    const defaultAdapters = instantiateSceneAdapters(
      engine,
      scene,
      engine.adapterRuntime.sceneAdapterFactories,
    );
    attachSceneAdapters(scene, defaultAdapters);

    return ok(scene);
  },
});
