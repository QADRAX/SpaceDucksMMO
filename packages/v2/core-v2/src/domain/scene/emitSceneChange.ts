import type { SceneState } from './types';
import type { SceneChangeEventWithError } from './types';

/** Notifies all scene change listeners and engine subsystems with scene event handlers. Swallows listener errors. */
export function emitSceneChange(scene: SceneState, event: SceneChangeEventWithError): void {
  for (const listener of scene.changeListeners) {
    try {
      listener(scene, event);
    } catch {
      /* observer must not break engine */
    }
  }

  if (scene.engine) {
    for (const sub of scene.engine.engineSubsystems) {
      const handler = sub.sceneEventHandlers?.[event.kind];
      if (handler) {
        try {
          handler(scene.engine!, scene, event);
        } catch {
          /* observer must not break engine */
        }
      }
    }
  }
}
