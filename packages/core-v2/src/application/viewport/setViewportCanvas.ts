import { defineViewportUseCase } from './viewportUseCase';

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
