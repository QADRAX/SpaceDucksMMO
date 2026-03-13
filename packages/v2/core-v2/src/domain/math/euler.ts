import type { EulerLike, QuatLike } from './types';
import { clamp } from './utils';

/**
 * Extracts Euler angles (YXZ order) from a quaternion.
 * Matches THREE.Euler.setFromQuaternion(q, 'YXZ') behaviour.
 */
export function eulerFromQuatYXZ(q: QuatLike): EulerLike {
  const x = q.x,
    y = q.y,
    z = q.z,
    w = q.w;
  const xx = x * x,
    yy = y * y,
    zz = z * z;
  const xy = x * y,
    xz = x * z,
    yz = y * z;
  const wx = w * x,
    wy = w * y,
    wz = w * z;

  const m13 = 2 * (xz + wy);
  const m21 = 2 * (xy + wz);
  const m22 = 1 - 2 * (xx + zz);
  const m23 = 2 * (yz - wx);
  const m31 = 2 * (xz - wy);
  const m33 = 1 - 2 * (xx + yy);
  const m11 = 1 - 2 * (yy + zz);

  const ex = Math.asin(-clamp(m23, -1, 1));
  let ey: number;
  let ez: number;

  if (Math.abs(m23) < 0.9999999) {
    ey = Math.atan2(m13, m33);
    ez = Math.atan2(m21, m22);
  } else {
    ey = Math.atan2(-m31, m11);
    ez = 0;
  }

  return { x: ex, y: ey, z: ez };
}

/** Creates an EulerLike with the given angles in radians. Defaults to (0,0,0). */
export function euler(x = 0, y = 0, z = 0): EulerLike {
  return { x, y, z };
}
