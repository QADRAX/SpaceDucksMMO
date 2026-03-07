import type { EulerLike, QuatLike, Vec3Like } from '../types';

/**
 * Creates a quaternion from Euler angles in YXZ order.
 * Matches Three.js convention (object3D.rotation.order = 'YXZ').
 */
export function quatFromEulerYXZ(e: EulerLike): QuatLike {
  const c1 = Math.cos(e.y / 2);
  const c2 = Math.cos(e.x / 2);
  const c3 = Math.cos(e.z / 2);
  const s1 = Math.sin(e.y / 2);
  const s2 = Math.sin(e.x / 2);
  const s3 = Math.sin(e.z / 2);
  return {
    x: s2 * c1 * c3 + c2 * s1 * s3,
    y: c2 * s1 * c3 - s2 * c1 * s3,
    z: c2 * c1 * s3 - s2 * s1 * c3,
    w: c2 * c1 * c3 + s2 * s1 * s3,
  };
}

/** Multiplies two quaternions: result = a * b. */
export function quatMul(a: QuatLike, b: QuatLike): QuatLike {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/** Returns the conjugate of a quaternion (negated imaginary part). */
export function quatConjugate(q: QuatLike): QuatLike {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

/** Normalizes a quaternion to unit length. */
export function quatNormalize(q: QuatLike): QuatLike {
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

/** Returns the inverse of a unit quaternion (equivalent to conjugate for normalized quats). */
export function quatInvert(q: QuatLike): QuatLike {
  return quatConjugate(q);
}

/**
 * Creates a quaternion that rotates the forward vector (0,0,-1) to point along `dir`.
 * Useful for lookAt-style behaviour.
 *
 * @param dir - Target direction (does not need to be normalized).
 * @param up - World up reference. Defaults to (0,1,0).
 */
export function quatFromDirection(dir: Vec3Like, up: Vec3Like = { x: 0, y: 1, z: 0 }): QuatLike {
  const fx = 0,
    fy = 0,
    fz = -1;
  const dx = dir.x,
    dy = dir.y,
    dz = dir.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
  const ndx = dx / len,
    ndy = dy / len,
    ndz = dz / len;

  let ax = fy * ndz - fz * ndy;
  let ay = fz * ndx - fx * ndz;
  let az = fx * ndy - fy * ndx;
  const alen = Math.sqrt(ax * ax + ay * ay + az * az);

  if (alen < 1e-6) {
    const dot = fx * ndx + fy * ndy + fz * ndz;
    if (dot < 0) return { x: up.x, y: up.y, z: up.z, w: 0 };
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  ax /= alen;
  ay /= alen;
  az /= alen;
  const dot = fx * ndx + fy * ndy + fz * ndz;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  const s = Math.sin(angle / 2);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(angle / 2) };
}
