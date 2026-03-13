import type { GameSettings } from '../../domain/engine';
import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns a snapshot of the current engine settings.
 */
export const getSettings = defineEngineUseCase<void, GameSettings>({
    name: 'getSettings',
    execute(engine) {
        return { ...engine.settings };
    },
});
