import type { EngineState } from '../types/engineState';
import { DEFAULT_GAME_SETTINGS } from '../types/settings';

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
