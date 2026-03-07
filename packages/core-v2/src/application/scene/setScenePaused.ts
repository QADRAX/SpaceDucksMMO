import { defineSceneUseCase } from '../../domain/useCases';

/** Parameters for the setScenePaused use case. */
export interface SetScenePausedParams {
    readonly paused: boolean;
}

/** Sets the scene paused state. When paused, only adapters with `updateWhenPaused` tick. */
export const setScenePaused = defineSceneUseCase<SetScenePausedParams, void>({
    name: 'setScenePaused',
    execute(scene, { paused }) {
        scene.paused = paused;
    },
});
