import type { EngineState } from '@duckengine/core-v2';

/**
 * Contract for the rendering engine subsystem state.
 * Implemented by rendering-three-gl-v2 and rendering-three-webgpu-v2.
 */
export interface RenderEngineState {
  /** Sync ECS to render tree (e.g. per viewport/scene). Called in preRender phase. */
  sync(engine: EngineState, dt: number): void;

  /** Draw all viewports. Called in render phase. */
  render(engine: EngineState, dt: number): void;

  /** Release resources. */
  dispose?(): void;
}
