import * as THREE from 'three';

export class Transform {
  private _localPosition: THREE.Vector3;
  private _localRotation: THREE.Euler;
  private _localScale: THREE.Vector3;
  private _worldPosition: THREE.Vector3;
  private _worldRotation: THREE.Euler;
  private _worldScale: THREE.Vector3;
  private _parent?: Transform;
  private _dirty = true;
  private _onChangeCallbacks: Array<() => void> = [];

  constructor(position?: [number, number, number]) {
    this._localPosition = new THREE.Vector3(...(position || [0, 0, 0]));
    this._localRotation = new THREE.Euler(0, 0, 0);
    this._localScale = new THREE.Vector3(1, 1, 1);
    this._worldPosition = this._localPosition.clone();
    this._worldRotation = this._localRotation.clone();
    this._worldScale = this._localScale.clone();
  }
  setPosition(x: number, y: number, z: number): void { this._localPosition.set(x, y, z); this.markDirty(); }
  get localPosition(): THREE.Vector3 { return this._localPosition; }
  get worldPosition(): THREE.Vector3 { if (this._dirty) this.updateWorldTransform(); return this._worldPosition; }
  setRotation(x: number, y: number, z: number): void { this._localRotation.set(x, y, z); this.markDirty(); }
  setRotationFromQuaternion(q: THREE.Quaternion): void { this._localRotation.setFromQuaternion(q); this.markDirty(); }
  get localRotation(): THREE.Euler { return this._localRotation; }
  get worldRotation(): THREE.Euler { if (this._dirty) this.updateWorldTransform(); return this._worldRotation; }
  setScale(x: number, y: number, z: number): void { this._localScale.set(x, y, z); this.markDirty(); }
  setUniformScale(s: number): void { this._localScale.set(s, s, s); this.markDirty(); }
  get localScale(): THREE.Vector3 { return this._localScale; }
  get worldScale(): THREE.Vector3 { if (this._dirty) this.updateWorldTransform(); return this._worldScale; }
  lookAt(target: THREE.Vector3): void {
    const m = new THREE.Matrix4(); m.lookAt(this.worldPosition, target, new THREE.Vector3(0,1,0));
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    this._localRotation.setFromQuaternion(q); this.markDirty();
  }
  setParent(parent: Transform | undefined): void { this._parent = parent; this.markDirty(); }
  get parent(): Transform | undefined { return this._parent; }
  private updateWorldTransform(): void {
    if (this._parent) {
      const pw = this._parent.worldPosition;
      const pr = this._parent.worldRotation;
      const ps = this._parent.worldScale;
      const rotated = this._localPosition.clone().applyEuler(pr).multiply(ps);
      this._worldPosition.copy(pw).add(rotated);
      const parentQuat = new THREE.Quaternion().setFromEuler(pr);
      const localQuat = new THREE.Quaternion().setFromEuler(this._localRotation);
      const worldQuat = parentQuat.multiply(localQuat);
      this._worldRotation.setFromQuaternion(worldQuat);
      this._worldScale.copy(this._localScale).multiply(ps);
    } else {
      this._worldPosition.copy(this._localPosition);
      this._worldRotation.copy(this._localRotation);
      this._worldScale.copy(this._localScale);
    }
    this._dirty = false; this.notifyChange();
  }
  private markDirty(): void { this._dirty = true; this.notifyChange(); }
  onChange(cb: () => void): void { this._onChangeCallbacks.push(cb); }
  removeOnChange(cb: () => void): void { const i = this._onChangeCallbacks.indexOf(cb); if (i>=0) this._onChangeCallbacks.splice(i,1); }
  private notifyChange(): void { for (const cb of this._onChangeCallbacks) cb(); }
  copyFrom(other: Transform): void { this._localPosition.copy(other._localPosition); this._localRotation.copy(other._localRotation); this._localScale.copy(other._localScale); this.markDirty(); }
  getForward(): THREE.Vector3 { return new THREE.Vector3(0,0,-1).applyEuler(this.worldRotation).normalize(); }
  getUp(): THREE.Vector3 { return new THREE.Vector3(0,1,0).applyEuler(this.worldRotation).normalize(); }
  getRight(): THREE.Vector3 { return new THREE.Vector3(1,0,0).applyEuler(this.worldRotation).normalize(); }
  clone(): Transform { const t = new Transform(); t.copyFrom(this); return t; }
}

export default Transform;