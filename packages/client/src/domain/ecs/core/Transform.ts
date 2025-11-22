import type { Vec3Like, EulerLike, QuatLike } from "./MathTypes";

function vec3FromArray(a?: [number, number, number]): Vec3Like {
  if (!a) return { x: 0, y: 0, z: 0 };
  return { x: a[0], y: a[1], z: a[2] };
}

function copyVec(v: Vec3Like): Vec3Like {
  return { x: v.x, y: v.y, z: v.z };
}

function copyEuler(e: EulerLike): EulerLike {
  return { x: e.x, y: e.y, z: e.z };
}

function quatFromEuler(e: EulerLike): QuatLike {
  // Euler order XYZ
  const c1 = Math.cos(e.x / 2);
  const c2 = Math.cos(e.y / 2);
  const c3 = Math.cos(e.z / 2);
  const s1 = Math.sin(e.x / 2);
  const s2 = Math.sin(e.y / 2);
  const s3 = Math.sin(e.z / 2);
  const x = s1 * c2 * c3 + c1 * s2 * s3 * -1; // note: match conventional formula
  const y = c1 * s2 * c3 + s1 * c2 * s3;
  const z = c1 * c2 * s3 - s1 * s2 * c3;
  const w = c1 * c2 * c3 - s1 * s2 * s3;
  return { x, y, z, w };
}

function multiplyQuat(a: QuatLike, b: QuatLike): QuatLike {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

function applyQuatToVec(v: Vec3Like, q: QuatLike): Vec3Like {
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

function quatFromDirection(dir: Vec3Like, up: Vec3Like = { x: 0, y: 1, z: 0 }): QuatLike {
  // Create quaternion that rotates forward (0,0,-1) to dir
  const fx = 0,
    fy = 0,
    fz = -1;
  const dx = dir.x,
    dy = dir.y,
    dz = dir.z;
  // normalize dir
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
    // parallel or anti-parallel
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

export class Transform {
  private _localPosition: Vec3Like;
  private _localRotation: EulerLike;
  private _localScale: Vec3Like;
  private _worldPosition: Vec3Like;
  private _worldRotation: EulerLike;
  private _worldScale: Vec3Like;
  private _parent?: Transform;
  private _dirty = true;
  private _onChangeCallbacks: Array<() => void> = [];
  private _parentChangeCallback?: () => void;

  constructor(position?: [number, number, number]) {
    this._localPosition = vec3FromArray(position);
    this._localRotation = { x: 0, y: 0, z: 0 };
    this._localScale = { x: 1, y: 1, z: 1 };
    this._worldPosition = copyVec(this._localPosition);
    this._worldRotation = copyEuler(this._localRotation);
    this._worldScale = copyVec(this._localScale);
  }

  setPosition(x: number, y: number, z: number): void {
    this._localPosition.x = x;
    this._localPosition.y = y;
    this._localPosition.z = z;
    this.markDirty();
  }

  get localPosition(): Vec3Like {
    return this._localPosition;
  }

  get worldPosition(): Vec3Like {
    if (this._dirty) this.updateWorldTransform();
    return this._worldPosition;
  }

  setRotation(x: number, y: number, z: number): void {
    this._localRotation.x = x;
    this._localRotation.y = y;
    this._localRotation.z = z;
    this.markDirty();
  }

  setRotationFromQuaternion(q: QuatLike): void {
    // convert quaternion to Euler (XYZ)
    const { x: qx, y: qy, z: qz, w: qw } = q;
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const rx = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (qw * qy - qz * qx);
    let ry: number;
    if (Math.abs(sinp) >= 1) ry = Math.sign(sinp) * Math.PI / 2;
    else ry = Math.asin(sinp);

    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const rz = Math.atan2(siny_cosp, cosy_cosp);

    this._localRotation.x = rx;
    this._localRotation.y = ry;
    this._localRotation.z = rz;
    this.markDirty();
  }

  get localRotation(): EulerLike {
    return this._localRotation;
  }

  get worldRotation(): EulerLike {
    if (this._dirty) this.updateWorldTransform();
    return this._worldRotation;
  }

  setScale(x: number, y: number, z: number): void {
    this._localScale.x = x;
    this._localScale.y = y;
    this._localScale.z = z;
    this.markDirty();
  }

  setUniformScale(s: number): void {
    this._localScale.x = s;
    this._localScale.y = s;
    this._localScale.z = s;
    this.markDirty();
  }

  get localScale(): Vec3Like {
    return this._localScale;
  }

  get worldScale(): Vec3Like {
    if (this._dirty) this.updateWorldTransform();
    return this._worldScale;
  }

  lookAt(target: Vec3Like): void {
    const dir = { x: target.x - this.worldPosition.x, y: target.y - this.worldPosition.y, z: target.z - this.worldPosition.z };
    const q = quatFromDirection(dir, { x: 0, y: 1, z: 0 });
    // convert quaternion to euler for worldRotation and set local rotation so that worldRotation becomes q
    this._worldRotation = this._worldRotation || { x: 0, y: 0, z: 0 };
    // set local rotation such that when updated it will reflect lookAt result (approximation: set localRotation from quat)
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const rx = Math.atan2(sinr_cosp, cosr_cosp);
    const sinp = 2 * (q.w * q.y - q.z * q.x);
    let ry: number;
    if (Math.abs(sinp) >= 1) ry = Math.sign(sinp) * Math.PI / 2;
    else ry = Math.asin(sinp);
    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const rz = Math.atan2(siny_cosp, cosy_cosp);
    this._localRotation.x = rx;
    this._localRotation.y = ry;
    this._localRotation.z = rz;
    this.markDirty();
  }

  setParent(parent: Transform | undefined): void {
    // detach previous subscription
    if (this._parent && this._parentChangeCallback) {
      this._parent.removeOnChange(this._parentChangeCallback);
      this._parentChangeCallback = undefined;
    }
    this._parent = parent;
    // subscribe to parent changes to propagate world dirty state
    if (this._parent) {
      this._parentChangeCallback = () => this.markDirty();
      this._parent.onChange(this._parentChangeCallback);
    }
    this.markDirty();
  }

  get parent(): Transform | undefined {
    return this._parent;
  }

  private updateWorldTransform(): void {
    if (this._parent) {
      const pw = this._parent.worldPosition;
      const pr = this._parent.worldRotation;
      const ps = this._parent.worldScale;
      // compute parent quaternion
      const parentQuat = quatFromEuler(pr);
      const localQuat = quatFromEuler(this._localRotation);
      const worldQuat = multiplyQuat(parentQuat, localQuat);
      // rotated local position by parent rotation
      const rotated = applyQuatToVec(this._localPosition, parentQuat);
      // apply scale
      rotated.x *= ps.x;
      rotated.y *= ps.y;
      rotated.z *= ps.z;
      this._worldPosition = { x: pw.x + rotated.x, y: pw.y + rotated.y, z: pw.z + rotated.z };
      // set world rotation from worldQuat
      // convert quaternion to euler
      const { x: qx, y: qy, z: qz, w: qw } = worldQuat;
      const sinr_cosp = 2 * (qw * qx + qy * qz);
      const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
      const rx = Math.atan2(sinr_cosp, cosr_cosp);
      const sinp = 2 * (qw * qy - qz * qx);
      let ry: number;
      if (Math.abs(sinp) >= 1) ry = Math.sign(sinp) * Math.PI / 2;
      else ry = Math.asin(sinp);
      const siny_cosp = 2 * (qw * qz + qx * qy);
      const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
      const rz = Math.atan2(siny_cosp, cosy_cosp);
      this._worldRotation = { x: rx, y: ry, z: rz };
      this._worldScale = { x: this._localScale.x * ps.x, y: this._localScale.y * ps.y, z: this._localScale.z * ps.z };
    } else {
      this._worldPosition = copyVec(this._localPosition);
      this._worldRotation = copyEuler(this._localRotation);
      this._worldScale = copyVec(this._localScale);
    }
    this._dirty = false;
    this.notifyChange();
  }

  private markDirty(): void {
    this._dirty = true;
    this.notifyChange();
  }

  onChange(cb: () => void): void {
    this._onChangeCallbacks.push(cb);
  }

  removeOnChange(cb: () => void): void {
    const i = this._onChangeCallbacks.indexOf(cb);
    if (i >= 0) this._onChangeCallbacks.splice(i, 1);
  }

  private notifyChange(): void {
    for (const cb of this._onChangeCallbacks) cb();
  }

  copyFrom(other: Transform): void {
    this._localPosition = copyVec(other._localPosition);
    this._localRotation = copyEuler(other._localRotation);
    this._localScale = copyVec(other._localScale);
    this.markDirty();
  }

  getForward(): Vec3Like {
    const q = quatFromEuler(this.worldRotation);
    const v = applyQuatToVec({ x: 0, y: 0, z: -1 }, q);
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  getUp(): Vec3Like {
    const q = quatFromEuler(this.worldRotation);
    const v = applyQuatToVec({ x: 0, y: 1, z: 0 }, q);
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  getRight(): Vec3Like {
    const q = quatFromEuler(this.worldRotation);
    const v = applyQuatToVec({ x: 1, y: 0, z: 0 }, q);
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  clone(): Transform {
    const t = new Transform();
    t.copyFrom(this);
    return t;
  }
}

export default Transform;
