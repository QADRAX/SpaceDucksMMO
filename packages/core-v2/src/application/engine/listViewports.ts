import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns the list of all registered viewport IDs.
 */
export const listViewports = defineEngineUseCase<void, string[]>({
    name: 'listViewports',
    execute(engine) {
        return [...engine.viewports.keys()];
    },
});
