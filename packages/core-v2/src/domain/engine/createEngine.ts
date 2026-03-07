import type { EngineState } from './types';
import { DEFAULT_GAME_SETTINGS } from './types';

/** Creates an empty engine state. */
export function createEngine(): EngineState {
  return {
    scenes: new Map(),
    viewports: new Map(),
    settings: { ...DEFAULT_GAME_SETTINGS },
    paused: false,
    running: false,
    engineAdapters: [],
  };
}
