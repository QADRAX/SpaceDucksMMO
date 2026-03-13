import { defineViewportUseCase } from '../../domain/useCases';
import type { CanvasId } from '../../domain/ids';

/** Parameters for setViewportCanvas. */
export interface SetViewportCanvasParams {
  readonly canvasId: CanvasId;
}

/** Changes the target canvas for this viewport. */
export const setViewportCanvas = defineViewportUseCase<SetViewportCanvasParams, void>({
  name: 'setViewportCanvas',
  execute(viewport, { canvasId }) {
    viewport.canvasId = canvasId;
  },
});
