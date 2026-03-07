import type { SceneState } from './types';
import type { SceneChangeEventWithError } from './types';

/** Notifies all scene change listeners. Swallows listener errors. */
export function emitSceneChange(scene: SceneState, event: SceneChangeEventWithError): void {
  for (const listener of scene.changeListeners) {
    try {
      listener(scene, event);
    } catch {
      /* observer must not break engine */
    }
  }
}
