import type { SceneState, ScenePorts } from '../types/sceneState';

/** Creates an empty scene state with optional port injection. */
export function createScene(id: string, ports?: Partial<ScenePorts>): SceneState {
  return {
    id,
    entities: new Map(),
    rootEntityIds: [],
    activeCameraId: null,
    debugFlags: new Map(),
    changeListeners: new Set(),
    entityCleanups: new Map(),
    ports: { ...ports },
  };
}
