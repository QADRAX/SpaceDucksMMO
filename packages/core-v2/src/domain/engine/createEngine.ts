import type { EngineState } from '../types/engineState';

/** Creates an empty engine state. */
export function createEngine(): EngineState {
  return {
    scenes: new Map(),
    activeSceneId: null,
    running: false,
  };
}
