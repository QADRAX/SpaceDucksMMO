import { clamp, lerp, inverseLerp, remap } from './utils';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clamp(15, 0, 10)).toBe(10));
  it('passes through within range', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(10, 20, 0)).toBe(10));
  it('returns b at t=1', () => expect(lerp(10, 20, 1)).toBe(20));
  it('returns midpoint at t=0.5', () => expect(lerp(10, 20, 0.5)).toBe(15));
});

describe('inverseLerp', () => {
  it('returns 0 at a', () => expect(inverseLerp(10, 20, 10)).toBe(0));
  it('returns 1 at b', () => expect(inverseLerp(10, 20, 20)).toBe(1));
  it('returns 0.5 at midpoint', () => expect(inverseLerp(10, 20, 15)).toBe(0.5));
  it('returns 0 when a === b', () => expect(inverseLerp(5, 5, 5)).toBe(0));
});

describe('remap', () => {
  it('remaps 5 from [0,10] to [0,100] as 50', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
  });
  it('remaps 0 from [0,10] to [20,40] as 20', () => {
    expect(remap(0, 0, 10, 20, 40)).toBe(20);
  });
});
