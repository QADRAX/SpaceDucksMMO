import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { defineEngineUseCase } from './engineUseCase';

/** Parameters for the removeViewport use case. */
export interface RemoveViewportParams {
  readonly viewportId: string;
}

/** Removes a viewport from the engine. */
export const removeViewport = defineEngineUseCase<RemoveViewportParams, Result<void>>({
  name: 'removeViewport',
  execute(engine, { viewportId }) {
    if (!engine.viewports.has(viewportId)) {
      return err('not-found', `Viewport '${viewportId}' not found.`);
    }

    engine.viewports.delete(viewportId);
    return ok(undefined);
  },
});
