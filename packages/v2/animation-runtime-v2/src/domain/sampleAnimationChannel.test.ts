import { describe, it, expect } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { AnimationChannelTrack } from '@duckengine/core-v2';
import { sampleAnimationChannelAtTime } from './sampleAnimationChannel';

describe('sampleAnimationChannelAtTime', () => {
  const boneId = createEntityId('bone');

  it('linear translation interpolates at midpoint', () => {
    const ch: AnimationChannelTrack = {
      targetEntityId: boneId,
      path: 'translation',
      interpolation: 'linear',
      times: [0, 1],
      values: [0, 0, 0, 10, 0, 0],
    };
    const s = sampleAnimationChannelAtTime(ch, 0.5);
    expect(s?.path).toBe('translation');
    if (s?.path === 'translation') {
      expect(s.v.x).toBeCloseTo(5);
      expect(s.v.y).toBeCloseTo(0);
      expect(s.v.z).toBeCloseTo(0);
    }
  });

  it('step translation holds value of last key at or before t', () => {
    const ch: AnimationChannelTrack = {
      targetEntityId: boneId,
      path: 'translation',
      interpolation: 'step',
      times: [0, 1],
      values: [0, 0, 0, 10, 0, 0],
    };
    const s = sampleAnimationChannelAtTime(ch, 0.99);
    expect(s?.path).toBe('translation');
    if (s?.path === 'translation') {
      expect(s.v.x).toBeCloseTo(0);
    }
  });

  it('returns null for empty times', () => {
    const ch: AnimationChannelTrack = {
      targetEntityId: boneId,
      path: 'translation',
      interpolation: 'linear',
      times: [],
      values: [],
    };
    expect(sampleAnimationChannelAtTime(ch, 0)).toBeNull();
  });
});
