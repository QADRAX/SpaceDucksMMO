import type { EngineState } from './types';
import { DEFAULT_GAME_SETTINGS } from './constants';
import { createSubsystemRuntimeState } from '../subsystems';

/** Creates an empty engine state. */
export function createEngine(): EngineState {
  return {
    scenes: new Map(),
    viewports: new Map(),
    canvases: new Map(),
    settings: { ...DEFAULT_GAME_SETTINGS },
    paused: false,
    running: false,
    setupComplete: false,
    engineSubsystems: [],
    subsystemRuntime: createSubsystemRuntimeState(),
    engineChangeListeners: new Set(),
  };
}
