import type { SceneState } from './sceneState';
import type { ViewportState } from './viewport';
import type { GameSettings } from './settings';
import type { EngineSystemAdapter } from './engineSystemAdapter';

/** Mutable engine state operated on by application-layer engine use cases. */
export interface EngineState {
  readonly scenes: Map<string, SceneState>;
  readonly viewports: Map<string, ViewportState>;
  settings: GameSettings;
  paused: boolean;
  running: boolean;
  /** Engine-level adapters (render, audio …) in pipeline order. */
  readonly engineAdapters: EngineSystemAdapter[];
}
