import type { SceneId } from '../ids';
import type { SceneState } from './types';

/** Creates an empty scene state. */
export function createScene(id: SceneId): SceneState {
  return {
    id,
    entities: new Map(),
    rootEntityIds: [],
    activeCameraId: null,
    debugFlags: new Map(),
    changeListeners: new Set(),
    entityCleanups: new Map(),
    subsystems: [],
    paused: false,
  };
}
