import type { Result } from '../../domain/utils';
import { ok } from '../../domain/utils';
import { defineEngineUseCase } from '../../domain/useCases';
import type { CanvasId } from '../../domain/ids';
import type { CanvasHandle } from '../../domain/engine';

/** Parameters for the registerCanvas use case. */
export interface RegisterCanvasParams {
  readonly canvasId: CanvasId;
  readonly element: CanvasHandle;
}

/** Registers a canvas with the engine. Subsystems (e.g. rendering) resolve canvasId via engine.canvases.get(canvasId). */
export const registerCanvas = defineEngineUseCase<RegisterCanvasParams, Result<void>>({
  name: 'registerCanvas',
  execute(engine, { canvasId, element }) {
    engine.canvases.set(canvasId, element);
    return ok(undefined);
  },
});
