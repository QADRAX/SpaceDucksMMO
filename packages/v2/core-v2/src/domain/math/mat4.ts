import type { QuatLike, Vec3Like } from './types';
import type { TransformState } from '../entities/types';
import { ensureClean } from '../entities/transform';
import { quatFromEulerYXZ } from './quat';

/** Column-major 4×4 matrix as 16 floats (same layout as Three.js `Matrix4.elements`). */
export type Mat4ColumnMajor = readonly number[];

/** Floats per joint for inverse bind / skin matrices in mesh assets. */
export const MAT4_FLOATS = 16;

/**
 * Multiplies two column-major 4×4 matrices: `out = a * b` (applies `b` first, then `a`).
 */
export function multiplyMat4ColumnMajor(
  a: readonly number[],
  b: readonly number[],
  bOffset = 0,
): readonly number[] {
  const out = new Array<number>(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row + k * 4] * b[bOffset + k + col * 4];
      }
      out[row + col * 4] = sum;
    }
  }
  return out;
}

/**
 * Skinning joint matrix: `skinMatrix = jointWorld * inverseBindMatrix` (column-major),
 * matching glTF / Three.js `SkinnedMesh` bone matrices when IBMs are in the same convention.
 */
export function skinMatrixColumnMajor(
  jointWorldColumnMajor: readonly number[],
  inverseBindColumnMajor: readonly number[],
  ibmOffset = 0,
): readonly number[] {
  return multiplyMat4ColumnMajor(jointWorldColumnMajor, inverseBindColumnMajor, ibmOffset);
}

/**
 * Composes a world TRS matrix from translation, quaternion, and scale (column-major).
 * Quaternion is expected in the same space as {@link quatFromEulerYXZ} / Three.js object rotation.
 */
export function composeMat4ColumnMajorFromTrs(
  position: Vec3Like,
  quaternion: QuatLike,
  scale: Vec3Like,
): readonly number[] {
  const x = quaternion.x;
  const y = quaternion.y;
  const z = quaternion.z;
  const w = quaternion.w;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  const sx = scale.x;
  const sy = scale.y;
  const sz = scale.z;

  return [
    (1 - (yy + zz)) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,
    (xy - wz) * sy,
    (1 - (xx + zz)) * sy,
    (yz + wx) * sy,
    0,
    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - (xx + yy)) * sz,
    0,
    position.x,
    position.y,
    position.z,
    1,
  ];
}

/**
 * World matrix for a transform (uses {@link ensureClean} so parent chain is resolved).
 */
export function worldMatrixColumnMajorFromTransform(transform: TransformState): readonly number[] {
  ensureClean(transform);
  const q = quatFromEulerYXZ(transform.worldRotation);
  return composeMat4ColumnMajorFromTrs(transform.worldPosition, q, transform.worldScale);
}
