import type { SceneState } from '../../domain/types/sceneState';
import type { SceneChangeEventWithError } from '../../domain/types/sceneEvents';

/** Notifies all scene change listeners. Swallows listener errors. */
export function emitSceneChange(scene: SceneState, event: SceneChangeEventWithError): void {
  for (const listener of scene.changeListeners) {
    try {
      listener(event);
    } catch {
      /* observer must not break engine */
    }
  }
}
