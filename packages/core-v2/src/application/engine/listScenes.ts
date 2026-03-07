import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns the list of all registered scene IDs.
 */
export const listScenes = defineEngineUseCase<void, string[]>({
    name: 'listScenes',
    execute(engine) {
        return [...engine.scenes.keys()];
    },
});
