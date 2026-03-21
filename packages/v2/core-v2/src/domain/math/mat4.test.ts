import { describe, it, expect } from '@jest/globals';
import {
  composeMat4ColumnMajorFromTrs,
  multiplyMat4ColumnMajor,
  skinMatrixColumnMajor,
  worldMatrixColumnMajorFromTransform,
} from './mat4';
import { createTransform } from '../entities/transform';

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

function expectMat4Approx(a: readonly number[], b: readonly number[]) {
  expect(a.length).toBe(16);
  expect(b.length).toBe(16);
  for (let i = 0; i < 16; i++) {
    expect(a[i]).toBeCloseTo(b[i], 5);
  }
}

describe('multiplyMat4ColumnMajor', () => {
  it('multiplies identity * identity', () => {
    const out = multiplyMat4ColumnMajor([...IDENTITY], [...IDENTITY]);
    expectMat4Approx(out, [...IDENTITY]);
  });
});

describe('skinMatrixColumnMajor', () => {
  it('is jointWorld * IBM with offset into a flat buffer', () => {
    const ibmFlat = [...IDENTITY, ...IDENTITY];
    const skin = skinMatrixColumnMajor([...IDENTITY], ibmFlat, 16);
    expectMat4Approx(skin, [...IDENTITY]);
  });
});

describe('worldMatrixColumnMajorFromTransform', () => {
  it('is identity for default transform', () => {
    const t = createTransform();
    const w = worldMatrixColumnMajorFromTransform(t);
    expectMat4Approx(w, [...IDENTITY]);
  });
});

describe('composeMat4ColumnMajorFromTrs', () => {
  it('places translation in column 3', () => {
    const m = composeMat4ColumnMajorFromTrs(
      { x: 1, y: 2, z: 3 },
      { x: 0, y: 0, z: 0, w: 1 },
      { x: 1, y: 1, z: 1 },
    );
    expect(m[12]).toBeCloseTo(1);
    expect(m[13]).toBeCloseTo(2);
    expect(m[14]).toBeCloseTo(3);
    expect(m[15]).toBeCloseTo(1);
  });
});
