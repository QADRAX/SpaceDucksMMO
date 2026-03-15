import {
  quatFromEulerYXZ,
  quatMul,
  quatConjugate,
  quatNormalize,
  quatInvert,
  quatFromDirection,
  quatFromLookAt,
} from './quat';
import { applyQuatToVec } from './vec3';

describe('quatFromEulerYXZ', () => {
  it('returns identity for zero angles', () => {
    const q = quatFromEulerYXZ({ x: 0, y: 0, z: 0 });
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(0);
    expect(q.w).toBeCloseTo(1);
  });

  it('90° yaw rotates +X to -Z', () => {
    const q = quatFromEulerYXZ({ x: 0, y: Math.PI / 2, z: 0 });
    const rotated = applyQuatToVec({ x: 1, y: 0, z: 0 }, q);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.z).toBeCloseTo(-1);
  });
});

describe('quatMul', () => {
  it('identity * q = q', () => {
    const id = { x: 0, y: 0, z: 0, w: 1 };
    const q = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
    const result = quatMul(id, q);
    expect(result.x).toBeCloseTo(q.x);
    expect(result.y).toBeCloseTo(q.y);
    expect(result.z).toBeCloseTo(q.z);
    expect(result.w).toBeCloseTo(q.w);
  });
});

describe('quatConjugate', () => {
  it('negates imaginary part', () => {
    const q = { x: 1, y: 2, z: 3, w: 4 };
    const c = quatConjugate(q);
    expect(c).toEqual({ x: -1, y: -2, z: -3, w: 4 });
  });
});

describe('quatNormalize', () => {
  it('normalizes to unit length', () => {
    const q = { x: 1, y: 1, z: 1, w: 1 };
    const n = quatNormalize(q);
    const len = Math.sqrt(n.x ** 2 + n.y ** 2 + n.z ** 2 + n.w ** 2);
    expect(len).toBeCloseTo(1);
  });
});

describe('quatInvert', () => {
  it('q * q⁻¹ ≈ identity for a unit quaternion', () => {
    const q = quatNormalize({ x: 0.1, y: 0.2, z: 0.3, w: 0.9 });
    const result = quatMul(q, quatInvert(q));
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
    expect(result.w).toBeCloseTo(1);
  });
});

describe('quatFromDirection', () => {
  it('returns identity when direction is already forward (0,0,-1)', () => {
    const q = quatFromDirection({ x: 0, y: 0, z: -1 });
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(0);
    expect(q.w).toBeCloseTo(1);
  });

  it('rotates forward to +X correctly', () => {
    const q = quatFromDirection({ x: 1, y: 0, z: 0 });
    const forward = applyQuatToVec({ x: 0, y: 0, z: -1 }, q);
    expect(forward.x).toBeCloseTo(1);
    expect(forward.y).toBeCloseTo(0);
    expect(forward.z).toBeCloseTo(0);
  });

  it('returns identity for zero-length direction', () => {
    const q = quatFromDirection({ x: 0, y: 0, z: 0 });
    expect(q.w).toBeCloseTo(1);
  });
});

describe('quatFromLookAt', () => {
  it('orients forward (0,0,-1) toward target from position', () => {
    const q = quatFromLookAt({ x: 5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    const forward = applyQuatToVec({ x: 0, y: 0, z: -1 }, q);
    expect(forward.x).toBeCloseTo(-1);
    expect(forward.y).toBeCloseTo(0);
    expect(forward.z).toBeCloseTo(0);
  });

  it('produces valid rotation with world-up constraint (no roll when orbiting horizontally)', () => {
    const pos = { x: 3, y: 2, z: 3 };
    const target = { x: 0, y: 2, z: 0 };
    const q = quatFromLookAt(pos, target);
    const forward = applyQuatToVec({ x: 0, y: 0, z: -1 }, q);
    const up = applyQuatToVec({ x: 0, y: 1, z: 0 }, q);
    const dir = { x: target.x - pos.x, y: target.y - pos.y, z: target.z - pos.z };
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    const expectedForward = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
    expect(forward.x).toBeCloseTo(expectedForward.x);
    expect(forward.y).toBeCloseTo(expectedForward.y);
    expect(forward.z).toBeCloseTo(expectedForward.z);
    expect(up.y).toBeGreaterThan(0.5);
  });

  it('returns identity when position equals target', () => {
    const q = quatFromLookAt({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 });
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(0);
    expect(q.w).toBeCloseTo(1);
  });
});
