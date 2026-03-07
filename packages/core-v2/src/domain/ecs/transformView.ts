import type { Vec3Like } from '../math';
import type { TransformState } from './types';
import { ensureClean } from './transform';
import { applyQuatToVec, quatFromEulerYXZ } from '../math';

/** Readonly snapshot created at boundaries (entity API, inspector, serialization). */
export interface TransformView {
  readonly localPosition: Readonly<Vec3Like>;
  readonly localRotation: Readonly<Vec3Like>;
  readonly localScale: Readonly<Vec3Like>;
  readonly worldPosition: Readonly<Vec3Like>;
  readonly worldRotation: Readonly<Vec3Like>;
  readonly worldScale: Readonly<Vec3Like>;
}

/** Creates a frozen readonly snapshot of the current transform values. */
export function createTransformView(t: TransformState): TransformView {
  ensureClean(t);
  return Object.freeze({
    localPosition: Object.freeze({ ...t.localPosition }),
    localRotation: Object.freeze({ ...t.localRotation }),
    localScale: Object.freeze({ ...t.localScale }),
    worldPosition: Object.freeze({ ...t.worldPosition }),
    worldRotation: Object.freeze({ ...t.worldRotation }),
    worldScale: Object.freeze({ ...t.worldScale }),
  });
}

function normalizeDir(v: Vec3Like): Vec3Like {
  const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

/** Returns the normalized forward direction (0,0,-1 rotated by world rotation). */
export function getForward(t: TransformState): Vec3Like {
  ensureClean(t);
  return normalizeDir(applyQuatToVec({ x: 0, y: 0, z: -1 }, quatFromEulerYXZ(t.worldRotation)));
}

/** Returns the normalized up direction (0,1,0 rotated by world rotation). */
export function getUp(t: TransformState): Vec3Like {
  ensureClean(t);
  return normalizeDir(applyQuatToVec({ x: 0, y: 1, z: 0 }, quatFromEulerYXZ(t.worldRotation)));
}

/** Returns the normalized right direction (1,0,0 rotated by world rotation). */
export function getRight(t: TransformState): Vec3Like {
  ensureClean(t);
  return normalizeDir(applyQuatToVec({ x: 1, y: 0, z: 0 }, quatFromEulerYXZ(t.worldRotation)));
}
