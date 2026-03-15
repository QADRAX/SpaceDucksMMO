import type { FramePhase } from '../../subsystems';

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
   * Records the total frame duration and finalizes the current frame.
   * Called once per frame after all phases complete.
   */
  recordFrameEnd(totalDurationMs: number): void;
}
