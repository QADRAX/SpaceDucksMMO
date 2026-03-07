import type { EngineState } from './engineState';

/**
 * An engine-level system adapter for cross-scene subsystems.
 *
 * Render and audio are typical engine adapters — they need to see
 * all scenes and viewports rather than being scoped to a single scene.
 */
export interface EngineSystemAdapter {
  /** Advance one frame tick. */
  update?(engine: EngineState, dt: number): void;
  /** If true, `update()` is called even when the engine is paused. */
  updateWhenPaused?: boolean;
  /** Release resources. */
  dispose?(): void;
}
