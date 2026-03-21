import type { PerformanceProfilingPort, FramePhase, SubsystemPhaseSlice } from '@duckengine/core-v2';
import type { PerformanceReportStorage } from './performanceReportStorage';

/**
 * Creates a PerformanceProfilingPort that records phase timings, per-subsystem
 * slices, and frame totals into the given storage. No globals.
 */
export function createPerformanceProfilingPort(
  storage: PerformanceReportStorage,
): PerformanceProfilingPort {
  let frameId = 0;

  return {
    recordPhase(phase: FramePhase, durationMs: number): void {
      storage.phases.push({ frame: frameId, phase, duration: durationMs });
    },

    recordSubsystemPhase(slice: SubsystemPhaseSlice): void {
      storage.subsystemSlices.push({
        frame: frameId,
        scope: slice.scope,
        sceneId: slice.sceneId,
        subsystemId: slice.subsystemId,
        phase: slice.phase,
        duration: slice.durationMs,
      });
    },

    recordFrameEnd(totalDurationMs: number): void {
      storage.frameTotals.push({ frame: frameId, duration: totalDurationMs });
      frameId++;
    },
  };
}
