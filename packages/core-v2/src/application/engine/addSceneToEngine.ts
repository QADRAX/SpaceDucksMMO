import type { ScenePorts } from '../../domain/types/sceneState';
import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { createScene } from '../../domain/scene/createScene';
import { defineEngineUseCase } from './engineUseCase';

/** Parameters for the addSceneToEngine use case. */
export interface AddSceneParams {
  readonly sceneId: string;
  readonly ports?: Partial<ScenePorts>;
}

/**
 * Creates a new scene and registers it in the engine.
 * Fails if a scene with the same id already exists.
 */
export const addSceneToEngine = defineEngineUseCase<AddSceneParams, Result<void>>({
  name: 'addSceneToEngine',
  execute(engine, { sceneId, ports }) {
    if (engine.scenes.has(sceneId)) {
      return err('validation', `Scene '${sceneId}' already exists.`);
    }

    const scene = createScene(sceneId, ports);
    engine.scenes.set(sceneId, scene);

    if (engine.activeSceneId === null) {
      engine.activeSceneId = sceneId;
    }

    return ok(undefined);
  },
});
