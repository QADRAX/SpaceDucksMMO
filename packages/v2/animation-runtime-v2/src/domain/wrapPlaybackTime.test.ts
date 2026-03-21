import { describe, it, expect } from '@jest/globals';
import { wrapPlaybackTimeForClip } from './wrapPlaybackTime';

describe('wrapPlaybackTimeForClip', () => {
  it('returns 0 when duration is 0', () => {
    expect(wrapPlaybackTimeForClip(5, 0, true)).toBe(0);
    expect(wrapPlaybackTimeForClip(5, 0, false)).toBe(0);
  });

  it('clamps to [0, duration] when not looping', () => {
    expect(wrapPlaybackTimeForClip(-1, 10, false)).toBe(0);
    expect(wrapPlaybackTimeForClip(3, 10, false)).toBe(3);
    expect(wrapPlaybackTimeForClip(12, 10, false)).toBe(10);
  });

  it('wraps modulo duration when looping', () => {
    expect(wrapPlaybackTimeForClip(2.5, 2, true)).toBeCloseTo(0.5);
    expect(wrapPlaybackTimeForClip(-0.5, 2, true)).toBeCloseTo(1.5);
  });
});
