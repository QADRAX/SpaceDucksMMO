import { describe, it, expect } from '@jest/globals';
import {
  diffProperties,
  applyPropertyChanges,
  shallowEqual,
} from './properties';

describe('properties', () => {
  describe('diffProperties', () => {
    it('returns empty when prev and next are equal', () => {
      const prev = { a: 1, b: 'x' };
      const next = { a: 1, b: 'x' };
      expect(diffProperties(prev, next)).toEqual([]);
    });

    it('returns keys whose values changed', () => {
      const prev = { a: 1, b: 'x' };
      const next = { a: 2, b: 'x' };
      expect(diffProperties(prev, next)).toEqual(['a']);
    });

    it('returns keys removed from next', () => {
      const prev = { a: 1, b: 2 };
      const next = { a: 1 };
      expect(diffProperties(prev, next)).toEqual(['b']);
    });

    it('returns keys added to next', () => {
      const prev = { a: 1 };
      const next = { a: 1, b: 2 };
      expect(diffProperties(prev, next)).toEqual(['b']);
    });

    it('returns multiple changed keys', () => {
      const prev = { a: 1, b: 2, c: 3 };
      const next = { a: 10, b: 2, c: 30 };
      expect(diffProperties(prev, next).sort()).toEqual(['a', 'c']);
    });

    it('compares arrays by shallow equality', () => {
      const prev = { vec: [1, 2, 3] as readonly [number, number, number] };
      const next = { vec: [1, 2, 3] as readonly [number, number, number] };
      expect(diffProperties(prev, next)).toEqual([]);
    });

    it('detects array changes', () => {
      const prev = { vec: [1, 2, 3] as readonly [number, number, number] };
      const next = { vec: [1, 2, 4] as readonly [number, number, number] };
      expect(diffProperties(prev, next)).toEqual(['vec']);
    });
  });

  describe('applyPropertyChanges', () => {
    it('applies changed values from source to target', () => {
      const target = { a: 1, b: 'old' };
      const source = { a: 2, b: 'old' };
      applyPropertyChanges(target, source, ['a']);
      expect(target).toEqual({ a: 2, b: 'old' });
    });

    it('removes keys not in source', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 1 };
      applyPropertyChanges(target, source, ['b']);
      expect(target).toEqual({ a: 1 });
    });

    it('adds new keys from source', () => {
      const target = { a: 1 };
      const source = { a: 1, b: 2 };
      applyPropertyChanges(target, source, ['b']);
      expect(target).toEqual({ a: 1, b: 2 });
    });

    it('handles empty changedKeys', () => {
      const target = { a: 1 };
      const source = { a: 1, b: 2 };
      applyPropertyChanges(target, source, []);
      expect(target).toEqual({ a: 1 });
    });
  });

  describe('shallowEqual', () => {
    it('returns true for same primitives', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('x', 'x')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
    });

    it('returns false for different primitives', () => {
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual('x', 'y')).toBe(false);
      expect(shallowEqual(null, undefined)).toBe(false);
    });

    it('returns true for equal arrays', () => {
      expect(shallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns false for different length arrays', () => {
      expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('returns false for different array elements', () => {
      expect(shallowEqual([1, 2], [1, 3])).toBe(false);
    });

    it('returns false when one is null', () => {
      expect(shallowEqual(1, null)).toBe(false);
      expect(shallowEqual(null, 1)).toBe(false);
    });
  });
});
