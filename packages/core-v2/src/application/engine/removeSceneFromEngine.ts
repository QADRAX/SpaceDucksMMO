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

    // Validation: Cannot remove a scene that is still in use by any viewport
    const viewportsInScene = Array.from(engine.viewports.values()).filter(
      (vp) => vp.sceneId === sceneId,
    );
    if (viewportsInScene.length > 0) {
      return err(
        'validation',
        `Cannot remove scene '${sceneId}' because it is still in use by viewports: ${viewportsInScene
          .map((vp) => vp.id)
          .join(', ')}.`,
      );
    }

    engine.scenes.delete(sceneId);

    return ok(undefined);
  },
});
