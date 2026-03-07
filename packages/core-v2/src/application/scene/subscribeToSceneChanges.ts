import type { SceneChangeEventWithError } from '../../domain/types/sceneEvents';
import { defineSceneUseCase } from './sceneUseCase';

/** Parameters for the subscribeToSceneChanges use case. */
export interface SubscribeToSceneChangesParams {
  readonly listener: (ev: SceneChangeEventWithError) => void;
}

/** Subscribes to scene change events. Returns an unsubscribe function. */
export const subscribeToSceneChanges = defineSceneUseCase<SubscribeToSceneChangesParams, () => void>({
  name: 'subscribeToSceneChanges',
  execute(scene, { listener }) {
    scene.changeListeners.add(listener);
    return () => {
      scene.changeListeners.delete(listener);
    };
  },
});
