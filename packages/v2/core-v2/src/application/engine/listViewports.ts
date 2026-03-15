import type { ViewportId } from '../../domain/ids';
import type { ViewportView } from '../../domain/viewport';
import type { ViewportRect } from '../../domain/viewport';
import { createViewportView } from '../../domain/viewport';
import { DEFAULT_RECT } from '../../domain/viewport/constants';
import { ViewportRectProviderPortDef } from '../../domain/ports';
import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns a list of all registered viewport snapshots.
 * Rect is resolved from ViewportRectProviderPort when registered.
 */
export const listViewports = defineEngineUseCase<void, ViewportView[]>({
  name: 'listViewports',
  execute(engine) {
    const port = engine.subsystemRuntime.ports.get(
      ViewportRectProviderPortDef.id,
    ) as { getRect: (id: ViewportId) => ViewportRect } | undefined;
    const getRect = port
      ? (id: ViewportId) => port.getRect(id)
      : () => DEFAULT_RECT;
    return [...engine.viewports.values()].map((vp) =>
      createViewportView(vp, getRect),
    );
  },
});
