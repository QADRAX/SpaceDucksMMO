import type {  ViewportRect  } from '../../domain/types/../viewport';
import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for resizeViewport. */
export interface ResizeViewportParams {
  readonly rect: Partial<ViewportRect>;
}

/**
 * Applies a partial update to the viewport's normalised rectangle.
 * Only the supplied fields are overwritten; the rest keeps its value.
 */
export const resizeViewport = defineViewportUseCase<ResizeViewportParams, void>({
  name: 'resizeViewport',
  execute(viewport, { rect }) {
    viewport.rect = { ...viewport.rect, ...rect };
  },
});
