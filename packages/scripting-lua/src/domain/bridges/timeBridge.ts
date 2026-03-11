import type { SceneState, ScriptSchema } from '@duckengine/core-v2';
import { buildTimeAPI } from '@duckengine/core-v2';
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
  const readTime = () =>
    buildTimeAPI({
      delta: state.delta,
      elapsed: state.elapsed,
      frameCount: state.frameCount,
      scale: state.scale,
    });

  return {
    name: 'Time',
    perEntity: false,
    factory(_scene: SceneState, _entityId, _schema: ScriptSchema | null) {
      return {
        getDelta() {
          return readTime().delta;
        },
        getElapsed() {
          return readTime().elapsed;
        },
        getFrameCount() {
          return readTime().frameCount;
        },
        getScale() {
          return readTime().scale;
        },
        setScale(s: number) {
          state.scale = Math.max(0, s);
        },
      };
    },
  };
}
