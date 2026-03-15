import type { EulerLike, QuatLike, Vec3Like } from './types';
import { vec3Cross, vec3Normalize } from './vec3';

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

/** Creates a QuatLike. Defaults to identity quaternion (0,0,0,1). */
export function quat(x = 0, y = 0, z = 0, w = 1): QuatLike {
  return { x, y, z, w };
}

const DEFAULT_WORLD_UP: Vec3Like = { x: 0, y: 1, z: 0 };
const EPS = 1e-6;

/**
 * Creates a quaternion that orients the entity to look at `target` from `position`,
 * with the camera's up vector constrained to stay horizontal (aligned with worldUp).
 * Prevents "neck twist" / roll when orbiting around a target.
 *
 * @param position - World position of the looker (e.g. camera).
 * @param target - World position to look at.
 * @param worldUp - World up vector. Defaults to (0,1,0).
 */
export function quatFromLookAt(
  position: Vec3Like,
  target: Vec3Like,
  worldUp: Vec3Like = DEFAULT_WORLD_UP,
): QuatLike {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dz = target.z - position.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < EPS) return { x: 0, y: 0, z: 0, w: 1 };

  const forward = { x: dx / len, y: dy / len, z: dz / len };
  let right = vec3Cross(forward, worldUp);
  const rightLen = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z);

  if (rightLen < EPS) {
    right = Math.abs(forward.y) > 0.99
      ? { x: 1, y: 0, z: 0 }
      : vec3Cross(forward, { x: 0, y: 1, z: 0 });
  }
  right = vec3Normalize(right);
  const up = vec3Cross(right, forward);

  const rx = right.x, ry = right.y, rz = right.z;
  const ux = up.x, uy = up.y, uz = up.z;
  const fx = -forward.x, fy = -forward.y, fz = -forward.z;

  const trace = rx + uy + fz;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return quatNormalize({
      x: (uz - fy) * s,
      y: (fx - rz) * s,
      z: (ry - ux) * s,
      w: 0.25 / s,
    });
  }
  if (rx > uy && rx > fz) {
    const s = 2 * Math.sqrt(1 + rx - uy - fz);
    return quatNormalize({
      x: 0.25 * s,
      y: (ux + ry) / s,
      z: (fx + rz) / s,
      w: (uz - fy) / s,
    });
  }
  if (uy > fz) {
    const s = 2 * Math.sqrt(1 + uy - rx - fz);
    return quatNormalize({
      x: (ux + ry) / s,
      y: 0.25 * s,
      z: (fy + uz) / s,
      w: (fx - rz) / s,
    });
  }
  const s = 2 * Math.sqrt(1 + fz - rx - uy);
  return quatNormalize({
    x: (fx + rz) / s,
    y: (fy + uz) / s,
    z: 0.25 * s,
    w: (ry - ux) / s,
  });
}
