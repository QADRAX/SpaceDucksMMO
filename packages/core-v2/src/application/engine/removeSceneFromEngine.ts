import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the removeSceneFromEngine use case. */
export interface RemoveSceneParams {
  readonly sceneId: string;
}

/**
 * Removes a scene from the engine.
 * If the removed scene was the active scene, active is cleared.
 * Does NOT call teardownScene — the caller should tear down first if needed.
 */
export const removeSceneFromEngine = defineEngineUseCase<RemoveSceneParams, Result<void>>({
  name: 'removeSceneFromEngine',
  execute(engine, { sceneId }) {
    if (!engine.scenes.has(sceneId)) {
      return err('not-found', `Scene '${sceneId}' not found.`);
    }

    engine.scenes.delete(sceneId);

    return ok(undefined);
  },
});
