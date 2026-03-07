import type { BridgeDeclaration, TimeState } from './types';

/** Creates a mutable time state. */
export function createTimeState(): TimeState {
  return { delta: 0, elapsed: 0, frameCount: 0, scale: 1 };
}

/**
 * Creates the time bridge declaration.
 * The adapter updates `state` each frame before running hooks.
 */
export function createTimeBridgeDeclaration(state: TimeState): BridgeDeclaration {
  return {
    name: 'Time',
    perEntity: false,
    factory() {
      return {
        getDelta() { return state.delta; },
        getElapsed() { return state.elapsed; },
        getFrameCount() { return state.frameCount; },
        getScale() { return state.scale; },
        setScale(s: number) { state.scale = Math.max(0, s); },
      };
    },
  };
}
