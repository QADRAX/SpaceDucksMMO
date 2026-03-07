import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for setViewportCanvas. */
export interface SetViewportCanvasParams {
  readonly canvasId: string;
}

/** Changes the target canvas for this viewport. */
export const setViewportCanvas = defineViewportUseCase<SetViewportCanvasParams, void>({
  name: 'setViewportCanvas',
  execute(viewport, { canvasId }) {
    viewport.canvasId = canvasId;
  },
});
