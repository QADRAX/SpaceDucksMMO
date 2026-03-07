import type { SceneState } from '../types/sceneState';

/** Creates an empty scene state. */
export function createScene(id: string): SceneState {
  return {
    id,
    entities: new Map(),
    rootEntityIds: [],
    activeCameraId: null,
    debugFlags: new Map(),
    changeListeners: new Set(),
    entityCleanups: new Map(),
    adapters: [],
    paused: false,
  };
}
