import type { ViewportState } from '../../domain/viewport';
import type { ViewportRect } from '../../domain/viewport';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { findScene, isCameraEntity } from '../../domain/engine/engineValidation';
import { createViewport } from '../../domain/engine/createViewport';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the addViewport use case. */
export interface AddViewportParams {
  readonly id: string;
  readonly sceneId: string;
  readonly cameraEntityId: string;
  readonly canvasId: string;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}

/**
 * Creates a viewport and registers it in the engine.
 * Validates the viewport id is unique, the scene exists,
 * and the camera entity exists in the scene with a cameraView component.
 * Returns the created ViewportState on success.
 */
export const addViewport = defineEngineUseCase<AddViewportParams, Result<ViewportState>>({
  name: 'addViewport',
  execute(engine, params) {
    if (engine.viewports.has(params.id)) {
      return err('validation', `Viewport '${params.id}' already exists.`);
    }

    const scene = findScene(engine, params.sceneId);
    if (!scene) {
      return err('not-found', `Scene '${params.sceneId}' not found.`);
    }

    if (!isCameraEntity(scene, params.cameraEntityId)) {
      return err(
        'not-found',
        `Camera entity '${params.cameraEntityId}' not found in scene '${params.sceneId}'.`,
      );
    }

    const viewport = createViewport(params);
    engine.viewports.set(viewport.id, viewport);
    return ok(viewport);
  },
});
