import { describe, it, expect } from '@jest/globals';
import { normalizeVec3Like } from './normalizePropertyValue';

describe('normalizeVec3Like', () => {
  it('converts object with x,y,z to plain { x, y, z }', () => {
    const result = normalizeVec3Like({ x: 1, y: 2, z: 3 });
    expect(result).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('converts string numbers to numbers', () => {
    const result = normalizeVec3Like({ x: '10', y: '20', z: '30' });
    expect(result).toEqual({ x: 10, y: 20, z: 30 });
  });

  it('returns value unchanged when not vec3-like', () => {
    expect(normalizeVec3Like(42)).toBe(42);
    expect(normalizeVec3Like('hello')).toBe('hello');
    expect(normalizeVec3Like(null)).toBe(null);
    expect(normalizeVec3Like(undefined)).toBe(undefined);
  });

  it('returns value unchanged when object lacks x, y, or z', () => {
    const obj = { a: 1, b: 2 };
    expect(normalizeVec3Like(obj)).toBe(obj);
  });

  it('returns value unchanged when object has only some of x,y,z', () => {
    const obj = { x: 1, y: 2 };
    expect(normalizeVec3Like(obj)).toBe(obj);
  });
});
