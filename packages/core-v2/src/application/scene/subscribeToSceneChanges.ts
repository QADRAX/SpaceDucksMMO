import type {  SceneChangeEventWithError  } from '../../domain/types/../scene';
import type {  SceneChangeListener  } from '../../domain/types/../scene';
import { defineSceneUseCase } from '../../domain/useCases';

/** Parameters for the subscribeToSceneChanges use case. */
export interface SubscribeToSceneChangesParams {
  readonly listener: (ev: SceneChangeEventWithError) => void;
}

/** Subscribes to scene change events. Returns an unsubscribe function. */
export const subscribeToSceneChanges = defineSceneUseCase<SubscribeToSceneChangesParams, () => void>({
  name: 'subscribeToSceneChanges',
  execute(scene, { listener }) {
    const wrapped: SceneChangeListener = (_scene, event) => listener(event);
    scene.changeListeners.add(wrapped);
    return () => {
      scene.changeListeners.delete(wrapped);
    };
  },
});
