import type { Vec3Like, EulerLike, QuatLike } from '../math';
import type { TransformState } from './types';
import {
  applyQuatToVec,
  eulerFromQuatYXZ,
  quatFromEulerYXZ,
  quatFromLookAt,
  quatMul,
} from '../math';

function copyVec(v: Vec3Like): Vec3Like {
  return { x: v.x, y: v.y, z: v.z };
}
function copyEuler(e: EulerLike): EulerLike {
  return { x: e.x, y: e.y, z: e.z };
}

function computeWorld(t: TransformState): void {
  if (t.parent) {
    ensureClean(t.parent);
    const pw = t.parent.worldPosition;
    const pr = t.parent.worldRotation;
    const ps = t.parent.worldScale;
    const pq = quatFromEulerYXZ(pr);
    const lq = quatFromEulerYXZ(t.localRotation);
    const wq = quatMul(pq, lq);
    const rotated = applyQuatToVec(t.localPosition, pq);
    t.worldPosition = {
      x: pw.x + rotated.x * ps.x,
      y: pw.y + rotated.y * ps.y,
      z: pw.z + rotated.z * ps.z,
    };
    t.worldRotation = eulerFromQuatYXZ(wq);
    t.worldScale = {
      x: t.localScale.x * ps.x,
      y: t.localScale.y * ps.y,
      z: t.localScale.z * ps.z,
    };
  } else {
    t.worldPosition = copyVec(t.localPosition);
    t.worldRotation = copyEuler(t.localRotation);
    t.worldScale = copyVec(t.localScale);
  }
  t.dirty = false;
}

/** Recomputes world-space values if the transform is dirty. */
export function ensureClean(t: TransformState): void {
  if (t.dirty) computeWorld(t);
}

function markDirty(t: TransformState): void {
  t.dirty = true;
  for (const cb of t.changeCbs) cb();
}

/** Creates a new transform state at the given position (defaults to origin). */
export function createTransform(pos?: [number, number, number]): TransformState {
  return {
    localPosition: pos ? { x: pos[0], y: pos[1], z: pos[2] } : { x: 0, y: 0, z: 0 },
    localRotation: { x: 0, y: 0, z: 0 },
    localScale: { x: 1, y: 1, z: 1 },
    worldPosition: { x: 0, y: 0, z: 0 },
    worldRotation: { x: 0, y: 0, z: 0 },
    worldScale: { x: 1, y: 1, z: 1 },
    parent: undefined,
    dirty: true,
    changeCbs: [],
    parentCb: undefined,
  };
}

/** Sets the local position and marks the transform dirty. */
export function setPosition(t: TransformState, x: number, y: number, z: number): void {
  t.localPosition.x = x;
  t.localPosition.y = y;
  t.localPosition.z = z;
  markDirty(t);
}

/** Sets the local rotation (Euler YXZ in radians) and marks dirty. */
export function setRotation(t: TransformState, x: number, y: number, z: number): void {
  t.localRotation.x = x;
  t.localRotation.y = y;
  t.localRotation.z = z;
  markDirty(t);
}

/** Sets the local rotation from a quaternion (converted to Euler YXZ). */
export function setRotationFromQuaternion(t: TransformState, q: QuatLike): void {
  const e = eulerFromQuatYXZ(q);
  t.localRotation.x = e.x;
  t.localRotation.y = e.y;
  t.localRotation.z = e.z;
  markDirty(t);
}

/** Sets the local scale and marks dirty. */
export function setScale(t: TransformState, x: number, y: number, z: number): void {
  t.localScale.x = x;
  t.localScale.y = y;
  t.localScale.z = z;
  markDirty(t);
}

/** Sets uniform scale on all axes. */
export function setUniformScale(t: TransformState, s: number): void {
  setScale(t, s, s, s);
}

/** Orients the transform to face a target world position.
 * Uses world-up constraint (0,1,0) to prevent roll/"neck twist" when orbiting.
 */
export function lookAt(t: TransformState, target: Vec3Like): void {
  ensureClean(t);
  const q = quatFromLookAt(t.worldPosition, target);
  const e = eulerFromQuatYXZ(q);
  t.localRotation.x = e.x;
  t.localRotation.y = e.y;
  t.localRotation.z = e.z;
  markDirty(t);
}

/** Sets or clears the parent. Manages dirty propagation automatically. */
export function setTransformParent(t: TransformState, parent: TransformState | undefined): void {
  if (t.parent && t.parentCb) {
    const i = t.parent.changeCbs.indexOf(t.parentCb);
    if (i >= 0) t.parent.changeCbs.splice(i, 1);
    t.parentCb = undefined;
  }
  t.parent = parent;
  if (t.parent) {
    t.parentCb = () => markDirty(t);
    t.parent.changeCbs.push(t.parentCb);
  }
  markDirty(t);
}

/** Copies local position, rotation, and scale from another transform state. */
export function copyTransform(t: TransformState, src: TransformState): void {
  t.localPosition = copyVec(src.localPosition);
  t.localRotation = copyEuler(src.localRotation);
  t.localScale = copyVec(src.localScale);
  markDirty(t);
}

/** Creates a deep copy of the transform state without parent link. */
export function cloneTransform(t: TransformState): TransformState {
  const c = createTransform();
  copyTransform(c, t);
  return c;
}

/** Registers a callback invoked whenever the transform changes. */
export function onTransformChange(t: TransformState, cb: () => void): void {
  t.changeCbs.push(cb);
}

/** Removes a previously registered change callback. */
export function removeTransformChange(t: TransformState, cb: () => void): void {
  const i = t.changeCbs.indexOf(cb);
  if (i >= 0) t.changeCbs.splice(i, 1);
}
