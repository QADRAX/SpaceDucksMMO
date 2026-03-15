import type { ViewportState } from '../../domain/viewport';
import type { ViewportRect } from '../../domain/viewport';
import { DEFAULT_RECT } from '../../domain/viewport/constants';
import { ViewportRectProviderPortDef } from '../../domain/ports';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { findScene, isCameraEntity } from '../../domain/engine/engineValidation';
import { createViewport } from '../../domain/engine/createViewport';
import { defineEngineUseCase } from '../../domain/useCases';

import type { ViewportId, SceneId, EntityId, CanvasId } from '../../domain/ids';

/** Parameters for the addViewport use case. */
export interface AddViewportParams {
  readonly id: ViewportId;
  readonly sceneId: SceneId;
  readonly cameraEntityId: EntityId;
  readonly canvasId: CanvasId;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}

/**
 * Creates a viewport and registers it in the engine.
 * Validates the viewport id is unique, the scene exists,
 * and the camera entity exists in the scene with a cameraView component.
 * If params.rect is provided and ViewportRectProviderPort is registered, sets initial rect.
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

    if (params.rect) {
      const port = engine.subsystemRuntime.ports.get(ViewportRectProviderPortDef.id) as
        | { setRect: (id: ViewportId, rect: Partial<ViewportRect>) => void }
        | undefined;
      if (port) {
        port.setRect(params.id, { ...DEFAULT_RECT, ...params.rect });
      }
    }

    return ok(viewport);
  },
});
