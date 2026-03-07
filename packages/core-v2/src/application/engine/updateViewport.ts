import type { ViewportRect } from '../../domain/types/viewport';
import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { defineEngineUseCase } from './engineUseCase';

/** Partial viewport fields that can be updated. */
export interface ViewportPatch {
  readonly sceneId?: string;
  readonly cameraEntityId?: string;
  readonly canvasId?: string;
  readonly rect?: Partial<ViewportRect>;
  readonly enabled?: boolean;
}

/** Parameters for the updateViewport use case. */
export interface UpdateViewportParams {
  readonly viewportId: string;
  readonly patch: ViewportPatch;
}

/**
 * Applies a partial update to an existing viewport.
 * Validates that referenced scene exists when sceneId is changed.
 */
export const updateViewport = defineEngineUseCase<UpdateViewportParams, Result<void>>({
  name: 'updateViewport',
  execute(engine, { viewportId, patch }) {
    const viewport = engine.viewports.get(viewportId);
    if (!viewport) {
      return err('not-found', `Viewport '${viewportId}' not found.`);
    }

    if (patch.sceneId !== undefined && !engine.scenes.has(patch.sceneId)) {
      return err('not-found', `Scene '${patch.sceneId}' not found.`);
    }

    const updated = {
      ...viewport,
      ...(patch.sceneId !== undefined && { sceneId: patch.sceneId }),
      ...(patch.cameraEntityId !== undefined && { cameraEntityId: patch.cameraEntityId }),
      ...(patch.canvasId !== undefined && { canvasId: patch.canvasId }),
      ...(patch.rect !== undefined && { rect: { ...viewport.rect, ...patch.rect } }),
      ...(patch.enabled !== undefined && { enabled: patch.enabled }),
    };

    engine.viewports.set(viewportId, updated);
    return ok(undefined);
  },
});
