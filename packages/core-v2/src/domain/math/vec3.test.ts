import { applyQuatToVec } from './vec3';

describe('applyQuatToVec', () => {
  it('returns the same vector for identity quaternion', () => {
    const v = { x: 1, y: 2, z: 3 };
    const identity = { x: 0, y: 0, z: 0, w: 1 };
    const result = applyQuatToVec(v, identity);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(2);
    expect(result.z).toBeCloseTo(3);
  });

  it('rotates (1,0,0) by 90° around Y axis to (0,0,-1)', () => {
    const v = { x: 1, y: 0, z: 0 };
    const angle = Math.PI / 2;
    const q = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
    const result = applyQuatToVec(v, q);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(-1);
  });

  it('rotates (0,0,-1) by 90° around X axis to (0,1,0)', () => {
    const v = { x: 0, y: 0, z: -1 };
    const angle = Math.PI / 2;
    const q = { x: Math.sin(angle / 2), y: 0, z: 0, w: Math.cos(angle / 2) };
    const result = applyQuatToVec(v, q);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });
});
