import type { PerformanceProfilingPort, FramePhase } from '@duckengine/core-v2';
import type { PerformanceReportStorage } from './performanceReportStorage';

/**
 * Creates a PerformanceProfilingPort that records phase timings and frame totals
 * into the given storage. No globals.
 */
export function createPerformanceProfilingPort(
  storage: PerformanceReportStorage,
): PerformanceProfilingPort {
  let frameId = 0;

  return {
    recordPhase(phase: FramePhase, durationMs: number): void {
      storage.phases.push({ frame: frameId, phase, duration: durationMs });
    },

    recordFrameEnd(totalDurationMs: number): void {
      storage.frameTotals.push({ frame: frameId, duration: totalDurationMs });
      frameId++;
    },
  };
}
