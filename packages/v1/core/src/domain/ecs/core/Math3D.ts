import type { EulerLike, QuatLike, Vec3Like } from "./MathTypes";

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Quaternion from Euler angles using the engine convention: YXZ order.
 * This matches Three.js usage in TransformSync (object3D.rotation.order = 'YXZ').
 */
export function quatFromEulerYXZ(e: EulerLike): QuatLike {
  const c1 = Math.cos(e.y / 2); // yaw
  const c2 = Math.cos(e.x / 2); // pitch
  const c3 = Math.cos(e.z / 2); // roll
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

export function quatMul(a: QuatLike, b: QuatLike): QuatLike {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

export function quatConjugate(q: QuatLike): QuatLike {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

export function quatNormalize(q: QuatLike): QuatLike {
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

export function quatInvert(q: QuatLike): QuatLike {
  // assuming normalized
  return quatConjugate(q);
}

export function applyQuatToVec(v: Vec3Like, q: QuatLike): Vec3Like {
  // v' = v + 2*cross(q.xyz, cross(q.xyz, v) + q.w*v)
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
  const rx = ix * qw + qy * iz - qz * iy - qx * (ix * qx + iy * qy + iz * qz);
  const ry = iy * qw + qz * ix - qx * iz - qy * (ix * qx + iy * qy + iz * qz);
  const rz = iz * qw + qx * iy - qy * ix - qz * (ix * qx + iy * qy + iz * qz);
  return { x: rx, y: ry, z: rz };
}

/**
 * Euler angles (YXZ order) from a quaternion.
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

  // Row-major m11..m33.
  const m11 = 1 - 2 * (yy + zz);
  const m13 = 2 * (xz + wy);
  const m21 = 2 * (xy + wz);
  const m22 = 1 - 2 * (xx + zz);
  const m23 = 2 * (yz - wx);
  const m31 = 2 * (xz - wy);
  const m33 = 1 - 2 * (xx + yy);

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

/**
 * Create quaternion that rotates forward (0,0,-1) to the given direction.
 * Useful for lookAt-style behaviour.
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

  // axis = cross(forward, dir)
  let ax = fy * ndz - fz * ndy;
  let ay = fz * ndx - fx * ndz;
  let az = fx * ndy - fy * ndx;
  const alen = Math.sqrt(ax * ax + ay * ay + az * az);
  if (alen < 1e-6) {
    const dot = fx * ndx + fy * ndy + fz * ndz;
    if (dot < 0) {
      // 180 degrees around up axis
      return { x: up.x, y: up.y, z: up.z, w: 0 };
    }
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
