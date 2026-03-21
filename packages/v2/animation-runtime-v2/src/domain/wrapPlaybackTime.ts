/**
 * Normalizes playback time to [0, duration] (no loop) or wraps modulo duration (loop).
 * Negative `duration` is treated as zero length.
 */
export function wrapPlaybackTimeForClip(time: number, duration: number, loop: boolean): number {
  if (duration <= 0) return 0;
  if (loop) {
    let t = time % duration;
    if (t < 0) t += duration;
    return t;
  }
  return Math.max(0, Math.min(duration, time));
}
