import {
  createTransform,
  setPosition,
  setRotation,
  setScale,
  setUniformScale,
  setRotationFromQuaternion,
  lookAt,
  setTransformParent,
  copyTransform,
  cloneTransform,
  onTransformChange,
  removeTransformChange,
  ensureClean,
} from './transform';
import { createTransformView, getForward, getUp, getRight } from './transformView';
import { quatFromEulerYXZ } from '../math';

describe('createTransform', () => {
  it('defaults to origin with unit scale', () => {
    const t = createTransform();
    expect(t.localPosition).toEqual({ x: 0, y: 0, z: 0 });
    expect(t.localScale).toEqual({ x: 1, y: 1, z: 1 });
    expect(t.dirty).toBe(true);
  });

  it('accepts initial position', () => {
    const t = createTransform([3, 4, 5]);
    expect(t.localPosition).toEqual({ x: 3, y: 4, z: 5 });
  });
});

describe('setPosition / setRotation / setScale', () => {
  it('updates local values and marks dirty', () => {
    const t = createTransform();
    ensureClean(t);
    expect(t.dirty).toBe(false);

    setPosition(t, 1, 2, 3);
    expect(t.localPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(t.dirty).toBe(true);
  });

  it('setRotation updates euler', () => {
    const t = createTransform();
    setRotation(t, 0.1, 0.2, 0.3);
    expect(t.localRotation.x).toBeCloseTo(0.1);
    expect(t.localRotation.y).toBeCloseTo(0.2);
    expect(t.localRotation.z).toBeCloseTo(0.3);
  });

  it('setScale updates all axes', () => {
    const t = createTransform();
    setScale(t, 2, 3, 4);
    expect(t.localScale).toEqual({ x: 2, y: 3, z: 4 });
  });

  it('setUniformScale sets all axes equally', () => {
    const t = createTransform();
    setUniformScale(t, 5);
    expect(t.localScale).toEqual({ x: 5, y: 5, z: 5 });
  });
});

describe('setRotationFromQuaternion', () => {
  it('converts quat to euler and stores', () => {
    const t = createTransform();
    const q = quatFromEulerYXZ({ x: 0.5, y: 0.3, z: 0.1 });
    setRotationFromQuaternion(t, q);
    expect(t.localRotation.x).toBeCloseTo(0.5, 4);
    expect(t.localRotation.y).toBeCloseTo(0.3, 4);
    expect(t.localRotation.z).toBeCloseTo(0.1, 4);
  });
});

describe('world-space computation', () => {
  it('world equals local when no parent', () => {
    const t = createTransform([5, 10, 15]);
    ensureClean(t);
    expect(t.worldPosition).toEqual({ x: 5, y: 10, z: 15 });
    expect(t.worldScale).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('composes parent position + child local position', () => {
    const parent = createTransform([10, 0, 0]);
    const child = createTransform([0, 5, 0]);
    setTransformParent(child, parent);
    ensureClean(child);
    expect(child.worldPosition.x).toBeCloseTo(10);
    expect(child.worldPosition.y).toBeCloseTo(5);
    expect(child.worldPosition.z).toBeCloseTo(0);
  });

  it('composes parent scale', () => {
    const parent = createTransform();
    setScale(parent, 2, 2, 2);
    const child = createTransform([1, 0, 0]);
    setTransformParent(child, parent);
    ensureClean(child);
    expect(child.worldPosition.x).toBeCloseTo(2);
    expect(child.worldScale.x).toBeCloseTo(2);
  });
});

describe('setTransformParent', () => {
  it('propagates dirty from parent to child', () => {
    const parent = createTransform();
    const child = createTransform();
    setTransformParent(child, parent);
    ensureClean(child);
    expect(child.dirty).toBe(false);

    setPosition(parent, 99, 0, 0);
    expect(child.dirty).toBe(true);
  });

  it('removes old parent callback on reparent', () => {
    const p1 = createTransform();
    const p2 = createTransform();
    const child = createTransform();
    setTransformParent(child, p1);
    expect(p1.changeCbs.length).toBe(1);

    setTransformParent(child, p2);
    expect(p1.changeCbs.length).toBe(0);
    expect(p2.changeCbs.length).toBe(1);
  });

  it('clears parent when set to undefined', () => {
    const parent = createTransform([10, 0, 0]);
    const child = createTransform([1, 0, 0]);
    setTransformParent(child, parent);
    setTransformParent(child, undefined);
    ensureClean(child);
    expect(child.worldPosition.x).toBeCloseTo(1);
    expect(parent.changeCbs.length).toBe(0);
  });
});

describe('copyTransform / cloneTransform', () => {
  it('copies local values from source', () => {
    const src = createTransform([1, 2, 3]);
    setRotation(src, 0.5, 0.3, 0.1);
    setScale(src, 2, 2, 2);
    const dst = createTransform();
    copyTransform(dst, src);
    expect(dst.localPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(dst.localScale).toEqual({ x: 2, y: 2, z: 2 });
    expect(dst.localRotation.x).toBeCloseTo(0.5);
  });

  it('clone creates independent copy', () => {
    const src = createTransform([7, 8, 9]);
    const c = cloneTransform(src);
    setPosition(src, 0, 0, 0);
    expect(c.localPosition).toEqual({ x: 7, y: 8, z: 9 });
    expect(c.parent).toBeUndefined();
  });
});

describe('onChange / removeOnChange', () => {
  it('fires callback on mutation', () => {
    const t = createTransform();
    let count = 0;
    onTransformChange(t, () => count++);
    setPosition(t, 1, 0, 0);
    setRotation(t, 0, 1, 0);
    expect(count).toBe(2);
  });

  it('removeTransformChange stops notifications', () => {
    const t = createTransform();
    let count = 0;
    const cb = () => count++;
    onTransformChange(t, cb);
    setPosition(t, 1, 0, 0);
    removeTransformChange(t, cb);
    setPosition(t, 2, 0, 0);
    expect(count).toBe(1);
  });
});

describe('lookAt', () => {
  it('rotates to face a target along -Z', () => {
    const t = createTransform();
    lookAt(t, { x: 0, y: 0, z: -10 });
    ensureClean(t);
    const fwd = getForward(t);
    expect(fwd.z).toBeCloseTo(-1, 1);
    expect(Math.abs(fwd.x)).toBeLessThan(0.01);
  });
});

describe('createTransformView', () => {
  it('returns a frozen snapshot', () => {
    const t = createTransform([1, 2, 3]);
    setScale(t, 4, 5, 6);
    const view = createTransformView(t);
    expect(view.localPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(view.worldPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(view.localScale).toEqual({ x: 4, y: 5, z: 6 });
    expect(Object.isFrozen(view)).toBe(true);
    expect(Object.isFrozen(view.localPosition)).toBe(true);
  });

  it('snapshot does not change when state mutates', () => {
    const t = createTransform([1, 0, 0]);
    const view = createTransformView(t);
    setPosition(t, 99, 0, 0);
    expect(view.localPosition.x).toBe(1);
  });
});

describe('direction helpers', () => {
  it('default forward is -Z', () => {
    const t = createTransform();
    const fwd = getForward(t);
    expect(fwd.x).toBeCloseTo(0);
    expect(fwd.y).toBeCloseTo(0);
    expect(fwd.z).toBeCloseTo(-1);
  });

  it('default up is +Y', () => {
    const t = createTransform();
    expect(getUp(t).y).toBeCloseTo(1);
  });

  it('default right is +X', () => {
    const t = createTransform();
    expect(getRight(t).x).toBeCloseTo(1);
  });

  it('directions rotate with transform', () => {
    const t = createTransform();
    setRotation(t, 0, Math.PI / 2, 0);
    const fwd = getForward(t);
    expect(fwd.x).toBeCloseTo(-1, 1);
    expect(Math.abs(fwd.z)).toBeLessThan(0.1);
  });
});
