/**
 * Shared storage for performance report data.
 * The engine port writes phases/frameTotals; the RAF recorder writes frames.
 */
export interface PerformanceReportStorage {
  phases: Array<{ frame: number; phase: string; duration: number }>;
  frameTotals: Array<{ frame: number; duration: number }>;
  frames: Array<{ frame: number; t: number; delta: number; fps: number }>;
  stopRaf?: () => void;
}

export function createPerformanceReportStorage(): PerformanceReportStorage {
  return {
    phases: [],
    frameTotals: [],
    frames: [],
  };
}
