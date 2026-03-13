import { eulerFromQuatYXZ } from './euler';
import { quatFromEulerYXZ } from './quat';

describe('eulerFromQuatYXZ', () => {
  it('round-trips zero angles', () => {
    const original = { x: 0, y: 0, z: 0 };
    const q = quatFromEulerYXZ(original);
    const back = eulerFromQuatYXZ(q);
    expect(back.x).toBeCloseTo(0);
    expect(back.y).toBeCloseTo(0);
    expect(back.z).toBeCloseTo(0);
  });

  it('round-trips 45° yaw', () => {
    const original = { x: 0, y: Math.PI / 4, z: 0 };
    const q = quatFromEulerYXZ(original);
    const back = eulerFromQuatYXZ(q);
    expect(back.x).toBeCloseTo(0);
    expect(back.y).toBeCloseTo(Math.PI / 4);
    expect(back.z).toBeCloseTo(0);
  });

  it('round-trips combined pitch + yaw', () => {
    const original = { x: 0.3, y: 0.7, z: 0 };
    const q = quatFromEulerYXZ(original);
    const back = eulerFromQuatYXZ(q);
    expect(back.x).toBeCloseTo(0.3);
    expect(back.y).toBeCloseTo(0.7);
    expect(back.z).toBeCloseTo(0);
  });

  it('handles gimbal lock near ±90° pitch', () => {
    const original = { x: Math.PI / 2, y: 0.5, z: 0 };
    const q = quatFromEulerYXZ(original);
    const back = eulerFromQuatYXZ(q);
    expect(back.x).toBeCloseTo(Math.PI / 2, 4);
  });
});
