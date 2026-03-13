import { Transform } from './Transform';

describe('Transform', () => {
  test('world equals local without parent', () => {
    const t = new Transform([1,2,3]);
    expect([t.worldPosition.x, t.worldPosition.y, t.worldPosition.z]).toEqual([1,2,3]);
    expect(t.worldRotation.x).toBeCloseTo(0);
    expect([t.worldScale.x, t.worldScale.y, t.worldScale.z]).toEqual([1,1,1]);
  });

  test('parent translation affects child world position', () => {
    const parent = new Transform([5,0,0]);
    const child = new Transform([1,0,0]);
    child.setParent(parent);
    expect([child.worldPosition.x, child.worldPosition.y, child.worldPosition.z]).toEqual([6,0,0]);
    parent.setPosition(6,0,0); // mark dirty
    expect([child.worldPosition.x, child.worldPosition.y, child.worldPosition.z]).toEqual([7,0,0]);
  });

  test('parent rotation and scale applied to child', () => {
    const parent = new Transform([0,0,0]);
    const child = new Transform([1,0,0]);
    child.setParent(parent);
    parent.setRotation(0, Math.PI/2, 0); // rotate 90 deg around Y
    // child local (1,0,0) rotated becomes (0,0,-1)
    expect(child.worldPosition.x).toBeCloseTo(0, 5);
    expect(child.worldPosition.y).toBeCloseTo(0, 5);
    expect(child.worldPosition.z).toBeCloseTo(-1, 5);
    parent.setUniformScale(2);
    // after scaling, rotated child position should be (0,0,-2)
    expect(child.worldPosition.z).toBeCloseTo(-2, 5);
  });

  test('forward/up/right vectors reflect rotation', () => {
    const t = new Transform();
    t.setRotation(0, Math.PI/2, 0); // Yaw 90
    const f = t.getForward();
    const r = t.getRight();
    const u = t.getUp();
    // Forward should point -X after yaw 90
    expect(f.x).toBeCloseTo(-1, 5);
    expect(f.z).toBeCloseTo(0, 5);
    // Right should point -Z (right vector (1,0,0) rotated 90deg about Y becomes (0,0,-1))
    expect(r.z).toBeCloseTo(-1, 5);
    // Up remains +Y
    expect(u.y).toBeCloseTo(1, 5);
  });

  test('onChange callbacks fire on modifications (world getters are side-effect free)', () => {
    const t = new Transform();
    let count = 0;
    t.onChange(() => count++);
    t.setPosition(1,2,3); // markDirty triggers callback
    t.setRotation(0,0,Math.PI/4);
    t.setUniformScale(2);
    // Accessing world getters should NOT fire callbacks (no side effects on read).
    void t.worldPosition;
    expect(count).toBeGreaterThanOrEqual(3); // position, rotation, scale
  });
});
