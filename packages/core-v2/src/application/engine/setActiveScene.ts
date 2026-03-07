import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { defineEngineUseCase } from './engineUseCase';

/** Parameters for the setActiveScene use case. */
export interface SetActiveSceneParams {
  readonly sceneId: string | null;
}

/**
 * Sets the active scene in the engine.
 * Pass null to clear the active scene.
 * Fails if the scene id does not exist.
 */
export const setActiveScene = defineEngineUseCase<SetActiveSceneParams, Result<void>>({
  name: 'setActiveScene',
  execute(engine, { sceneId }) {
    if (sceneId !== null && !engine.scenes.has(sceneId)) {
      return err('not-found', `Scene '${sceneId}' not found.`);
    }

    engine.activeSceneId = sceneId;
    return ok(undefined);
  },
});
