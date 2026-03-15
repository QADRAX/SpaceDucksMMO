import type { ViewportRect } from '../../domain/viewport';
import { ViewportRectProviderPortDef } from '../../domain/ports';
import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for resizeViewport. */
export interface ResizeViewportParams {
  readonly rect: Partial<ViewportRect>;
}

/**
 * Applies a partial update to the viewport's normalised rectangle via ViewportRectProviderPort.
 * Only the supplied fields are overwritten; the rest keeps its value.
 */
export const resizeViewport = defineViewportUseCase<ResizeViewportParams, void>({
  name: 'resizeViewport',
  execute(viewport, { rect }, context) {
    const port = context?.engine.subsystemRuntime.ports.get(
      ViewportRectProviderPortDef.id,
    ) as { getRect: (id: unknown) => ViewportRect; setRect: (id: unknown, r: Partial<ViewportRect>) => void }
      | undefined;
    if (port) {
      port.setRect(viewport.id, { ...port.getRect(viewport.id), ...rect });
    }
  },
});
