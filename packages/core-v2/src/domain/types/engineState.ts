import type { SceneState } from './sceneState';

/** Mutable engine state operated on by application-layer engine use cases. */
export interface EngineState {
  readonly scenes: Map<string, SceneState>;
  activeSceneId: string | null;
  running: boolean;
}
