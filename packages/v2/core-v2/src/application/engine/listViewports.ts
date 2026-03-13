import type { ViewportView } from '../../domain/viewport';
import { createViewportView } from '../../domain/viewport';
import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns a list of all registered viewport snapshots.
 */
export const listViewports = defineEngineUseCase<void, ViewportView[]>({
    name: 'listViewports',
    execute(engine) {
        return [...engine.viewports.values()].map((vp) => createViewportView(vp));
    },
});
