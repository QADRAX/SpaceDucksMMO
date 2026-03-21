import type { FramePhase } from '../../subsystems';

/** Where a profiled subsystem callback ran (engine-wide vs per-scene). */
export type SubsystemProfilingScope = 'engine' | 'scene';

/**
 * One subsystem’s contribution to a single frame phase.
 * Used to compare preRender/render vs update-style work per subsystem.
 */
export interface SubsystemPhaseSlice {
  readonly scope: SubsystemProfilingScope;
  /** Set when `scope` is `'scene'` — which scene instance ran the callback. */
  readonly sceneId?: string;
  /** From subsystem config (`createEngineSubsystem` / `createSceneSubsystem` `id`), or a generated fallback. */
  readonly subsystemId: string;
  readonly phase: FramePhase;
  readonly durationMs: number;
}

/**
 * Contract for frame-by-frame performance profiling.
 * Implementations can record phase timings and frame totals for test reports,
 * dev tools, or analytics. Core only calls when the port is registered.
 */
export interface PerformanceProfilingPort {
  /**
   * Records the duration of a frame phase.
   * Called after each phase (earlyUpdate, physics, update, etc.) completes.
   */
  recordPhase(phase: FramePhase, durationMs: number): void;

  /**
   * Records one subsystem’s time within a phase (engine or scene callback).
   * Lets reports distinguish rendering vs gameplay updates within the same phase total.
   */
  recordSubsystemPhase(slice: SubsystemPhaseSlice): void;

  /**
   * Records the total frame duration and finalizes the current frame.
   * Called once per frame after all phases complete.
   */
  recordFrameEnd(totalDurationMs: number): void;
}
