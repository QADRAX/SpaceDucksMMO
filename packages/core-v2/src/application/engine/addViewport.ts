import type { ViewportRect } from '../../domain/types/viewport';
import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { createViewport } from '../../domain/engine/createViewport';
import { defineEngineUseCase } from './engineUseCase';

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
 * Fails if the scene does not exist or the viewport id is taken.
 */
export const addViewport = defineEngineUseCase<AddViewportParams, Result<void>>({
  name: 'addViewport',
  execute(engine, params) {
    if (engine.viewports.has(params.id)) {
      return err('validation', `Viewport '${params.id}' already exists.`);
    }
    if (!engine.scenes.has(params.sceneId)) {
      return err('not-found', `Scene '${params.sceneId}' not found.`);
    }

    const viewport = createViewport(params);
    engine.viewports.set(viewport.id, viewport);
    return ok(undefined);
  },
});
