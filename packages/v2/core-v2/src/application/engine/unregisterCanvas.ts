import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineEngineUseCase } from '../../domain/useCases';
import type { CanvasId } from '../../domain/ids';

/** Parameters for the unregisterCanvas use case. */
export interface UnregisterCanvasParams {
  readonly canvasId: CanvasId;
}

/** Removes a canvas from the engine registry. */
export const unregisterCanvas = defineEngineUseCase<UnregisterCanvasParams, Result<void>>({
  name: 'unregisterCanvas',
  execute(engine, { canvasId }) {
    if (!engine.canvases.has(canvasId)) {
      return err('not-found', `Canvas '${canvasId}' not found.`);
    }

    engine.canvases.delete(canvasId);
    return ok(undefined);
  },
});
