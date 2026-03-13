import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the setEnginePaused use case. */
export interface SetEnginePausedParams {
    readonly paused: boolean;
}

/** Sets the engine paused state. When paused, only adapters with `updateWhenPaused` tick. */
export const setEnginePaused = defineEngineUseCase<SetEnginePausedParams, void>({
    name: 'setEnginePaused',
    execute(engine, { paused }) {
        engine.paused = paused;
    },
});
