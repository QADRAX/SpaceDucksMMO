import type { PerformanceReportStorage } from './performanceReportStorage';

/**
 * Starts recording rAF frame timings into storage.frames.
 * Returns a stop function. Sets storage.stopRaf for external stop.
 */
export function startRafRecording(storage: PerformanceReportStorage): () => void {
  let running = true;
  let lastTime = performance.now();
  let frameIndex = 0;

  function recordFrame(timestamp: number): void {
    if (!running) return;
    const delta = timestamp - lastTime;
    storage.frames.push({
      frame: frameIndex++,
      t: timestamp,
      delta,
      fps: delta > 0 ? 1000 / delta : 0,
    });
    lastTime = timestamp;
    requestAnimationFrame(recordFrame);
  }

  requestAnimationFrame(recordFrame);

  const stop = (): void => {
    running = false;
  };

  storage.stopRaf = stop;
  return stop;
}
