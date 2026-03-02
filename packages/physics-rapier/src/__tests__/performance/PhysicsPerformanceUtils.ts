/**
 * Performance measurement utilities for Rapier physics stress testing
 * Measures frame time delta from physics simulation (no rendering)
 */

export const TARGET_FPS = 144;
export const FRAME_BUDGET_MS = 1000 / TARGET_FPS; // ~6.94ms

export interface FrameMetrics {
  frameTime: number; // milliseconds
  collisionCount: number;
  bodiesCount: number;
  collidersCount: number;
}

export interface StressTestResult {
  scenarioName: string;
  entityCount: number;
  colliderCount: number;
  totalFrames: number;
  metrics: {
    avg_ms: number;
    min_ms: number;
    max_ms: number;
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    stdDev_ms: number;
  };
  collisions: {
    total_events: number;
    avg_per_frame: number;
    max_per_frame: number;
  };
  stability: {
    frames_within_budget: number;
    frames_exceeding_budget: number;
    stability_percent: number;
    estimated_fps: number;
  };
  timestamp: string;
}

export class PhysicsStressTester {
  private frameTimes: number[] = [];
  private collisionCounts: number[] = [];
  private totalCollisionEvents = 0;

  /**
   * Record a single frame's metrics
   */
  recordFrame(frameTime: number, collisionCount: number): void {
    this.frameTimes.push(frameTime);
    this.collisionCounts.push(collisionCount);
    this.totalCollisionEvents += collisionCount;
  }

  /**
   * Calculate comprehensive statistics
   */
  computeResults(
    scenarioName: string,
    entityCount: number,
    colliderCount: number
  ): StressTestResult {
    if (this.frameTimes.length === 0) {
      throw new Error("No frame metrics recorded");
    }

    const times = this.frameTimes.sort((a, b) => a - b);
    const totalFrames = times.length;

    // Basic stats
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / totalFrames;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / totalFrames;
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const percentile = (p: number) => {
      const idx = Math.ceil((p / 100) * totalFrames) - 1;
      return times[Math.max(0, idx)];
    };

    // Budget tracking
    const framesWithinBudget = times.filter((t) => t <= FRAME_BUDGET_MS).length;
    const framesExceedingBudget = totalFrames - framesWithinBudget;
    const stabilityPercent = (framesWithinBudget / totalFrames) * 100;

    // Estimated actual FPS (based on average frame time)
    const estimatedFps = 1000 / avg;

    // Collision stats
    const collisions = this.collisionCounts.sort((a, b) => a - b);
    const maxCollisions = collisions[collisions.length - 1] || 0;
    const avgCollisionsPerFrame = this.totalCollisionEvents / totalFrames;

    return {
      scenarioName,
      entityCount,
      colliderCount,
      totalFrames,
      metrics: {
        avg_ms: avg,
        min_ms: times[0],
        max_ms: times[times.length - 1],
        p50_ms: percentile(50),
        p95_ms: percentile(95),
        p99_ms: percentile(99),
        stdDev_ms: stdDev,
      },
      collisions: {
        total_events: this.totalCollisionEvents,
        avg_per_frame: avgCollisionsPerFrame,
        max_per_frame: maxCollisions,
      },
      stability: {
        frames_within_budget: framesWithinBudget,
        frames_exceeding_budget: framesExceedingBudget,
        stability_percent: stabilityPercent,
        estimated_fps: estimatedFps,
      },
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    this.frameTimes = [];
    this.collisionCounts = [];
    this.totalCollisionEvents = 0;
  }
}

/**
 * Helper to measure function execution time in milliseconds
 */
export function measureTimeMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

/**
 * Format results as human-readable table
 */
export function formatResultsTable(results: StressTestResult[]): string {
  const lines: string[] = [];

  lines.push("=".repeat(140));
  lines.push("PHYSICS STRESS TEST RESULTS");
  lines.push("=".repeat(140));
  lines.push("");

  lines.push("Frame Time Performance (ms):");
  lines.push(
    "| Scenario | Entities | Colliders | Avg | P95 | P99 | Stability | Est. FPS | Budget Check |"
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---|");

  for (const result of results) {
    const budgetCheck =
      result.stability.stability_percent >= 99
        ? "✓ PASS"
        : result.stability.stability_percent >= 95
          ? "⚠ WARN"
          : "✗ FAIL";

    lines.push(
      `| ${result.scenarioName.padEnd(15)} | ${result.entityCount.toString().padStart(7)} | ${result.colliderCount.toString().padStart(9)} | ${result.metrics.avg_ms.toFixed(3).padStart(5)} | ${result.metrics.p95_ms.toFixed(3).padStart(5)} | ${result.metrics.p99_ms.toFixed(3).padStart(5)} | ${result.stability.stability_percent.toFixed(1).padStart(5)}% | ${result.stability.estimated_fps.toFixed(1).padStart(6)} | ${budgetCheck} |`
    );
  }

  lines.push("");
  lines.push("Collision Event Statistics:");
  lines.push("| Scenario | Total Events | Avg/Frame | Max/Frame |");
  lines.push("|---|---:|---:|---:|");

  for (const result of results) {
    lines.push(
      `| ${result.scenarioName.padEnd(15)} | ${result.collisions.total_events.toString().padStart(12)} | ${result.collisions.avg_per_frame.toFixed(2).padStart(9)} | ${result.collisions.max_per_frame.toString().padStart(9)} |`
    );
  }

  lines.push("");
  lines.push(`Frame Budget @ ${TARGET_FPS} FPS: ${FRAME_BUDGET_MS.toFixed(2)}ms`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Export results as JSON for analysis
 */
export function resultsToJSON(results: StressTestResult[]): string {
  return JSON.stringify(
    {
      target_fps: TARGET_FPS,
      frame_budget_ms: FRAME_BUDGET_MS,
      generated_at: new Date().toISOString(),
      results,
    },
    null,
    2
  );
}

/**
 * Export results as CSV for spreadsheet analysis
 */
export function resultsToCSV(results: StressTestResult[]): string {
  const lines: string[] = [];

  // Header
  lines.push(
    "Scenario,Entities,Colliders,Avg(ms),Min(ms),Max(ms),P50(ms),P95(ms),P99(ms),StdDev(ms)," +
      "FramesWithinBudget,FramesExceeding,Stability(%),EstimatedFPS," +
      "TotalCollisions,AvgCollisionsPerFrame,MaxCollisionsPerFrame"
  );

  // Rows
  for (const result of results) {
    const row = [
      result.scenarioName,
      result.entityCount,
      result.colliderCount,
      result.metrics.avg_ms.toFixed(3),
      result.metrics.min_ms.toFixed(3),
      result.metrics.max_ms.toFixed(3),
      result.metrics.p50_ms.toFixed(3),
      result.metrics.p95_ms.toFixed(3),
      result.metrics.p99_ms.toFixed(3),
      result.metrics.stdDev_ms.toFixed(3),
      result.stability.frames_within_budget,
      result.stability.frames_exceeding_budget,
      result.stability.stability_percent.toFixed(1),
      result.stability.estimated_fps.toFixed(1),
      result.collisions.total_events,
      result.collisions.avg_per_frame.toFixed(2),
      result.collisions.max_per_frame,
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}
