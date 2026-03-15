import type { Vec3Like, QuatLike } from './types';

/**
 * Rotates a vector by a quaternion.
 * Uses the formula: v' = q * v * q⁻¹ (optimized without intermediate quaternion).
 */
export function applyQuatToVec(v: Vec3Like, q: QuatLike): Vec3Like {
  const qx = q.x,
    qy = q.y,
    qz = q.z,
    qw = q.w;
  const vx = v.x,
    vy = v.y,
    vz = v.z;
  const ix = qw * vx + qy * vz - qz * vy;
  const iy = qw * vy + qz * vx - qx * vz;
  const iz = qw * vz + qx * vy - qy * vx;
  const dot = ix * qx + iy * qy + iz * qz;
  return {
    x: ix * qw + qy * iz - qz * iy - qx * dot,
    y: iy * qw + qz * ix - qx * iz - qy * dot,
    z: iz * qw + qx * iy - qy * ix - qz * dot,
  };
}

/** Creates a Vec3Like with the given components. Defaults to origin (0,0,0). */
export function vec3(x = 0, y = 0, z = 0): Vec3Like {
  return { x, y, z };
}

/** Cross product: a × b (right-handed). */
export function vec3Cross(a: Vec3Like, b: Vec3Like): Vec3Like {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Returns a normalized copy of v, or zero vector if length is 0. */
export function vec3Normalize(v: Vec3Like): Vec3Like {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-10) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}
