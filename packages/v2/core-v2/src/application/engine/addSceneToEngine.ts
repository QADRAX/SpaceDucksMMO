import type { SceneState } from '../../domain/scene';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { createScene } from '../../domain/scene/createScene';
import { defineEngineUseCase } from '../../domain/useCases';
import {
  attachSceneSubsystems,
  instantiateSceneSubsystems,
  runSubsystemPortDerivers,
} from '../../domain/subsystems';

import type { SceneId } from '../../domain/ids';

/** Parameters for the addSceneToEngine use case. */
export interface AddSceneParams {
  readonly sceneId: SceneId;
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

    // Engine-level scene subsystem factories are applied automatically to each new scene.
    runSubsystemPortDerivers(engine);
    const defaultSubsystems = instantiateSceneSubsystems(
      engine,
      scene,
      engine.subsystemRuntime.sceneSubsystemFactories,
    );
    attachSceneSubsystems(scene, defaultSubsystems);

    return ok(scene);
  },
});
