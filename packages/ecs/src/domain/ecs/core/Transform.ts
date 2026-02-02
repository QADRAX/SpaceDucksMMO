import type { Vec3Like, EulerLike, QuatLike } from "./MathTypes";
import { applyQuatToVec, eulerFromQuatYXZ, quatFromDirection, quatFromEulerYXZ, quatMul } from "./Math3D";

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
    // Convert quaternion to Euler using the engine's rotation order (YXZ).
    const e = eulerFromQuatYXZ(q);
    this._localRotation.x = e.x;
    this._localRotation.y = e.y;
    this._localRotation.z = e.z;
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
    const e = eulerFromQuatYXZ(q);
    this._localRotation.x = e.x;
    this._localRotation.y = e.y;
    this._localRotation.z = e.z;
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
      const parentQuat = quatFromEulerYXZ(pr);
      const localQuat = quatFromEulerYXZ(this._localRotation);
      const worldQuat = quatMul(parentQuat, localQuat);
      // rotated local position by parent rotation
      const rotated = applyQuatToVec(this._localPosition, parentQuat);
      // apply scale
      rotated.x *= ps.x;
      rotated.y *= ps.y;
      rotated.z *= ps.z;
      this._worldPosition = { x: pw.x + rotated.x, y: pw.y + rotated.y, z: pw.z + rotated.z };
      // set world rotation from worldQuat
      this._worldRotation = eulerFromQuatYXZ(worldQuat);
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
    const q = quatFromEulerYXZ(this.worldRotation);
    const v = applyQuatToVec({ x: 0, y: 0, z: -1 }, q);
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  getUp(): Vec3Like {
    const q = quatFromEulerYXZ(this.worldRotation);
    const v = applyQuatToVec({ x: 0, y: 1, z: 0 }, q);
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  getRight(): Vec3Like {
    const q = quatFromEulerYXZ(this.worldRotation);
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
