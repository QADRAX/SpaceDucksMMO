import * as THREE from 'three';

/**
 * Transform - Representa posición, rotación y escala de una entity en el espacio 3D.
 * 
 * Soporta jerarquía padre-hijo con transforms relativos:
 * - Local: valores relativos al padre
 * - World: valores absolutos en el espacio mundial
 * 
 * Los valores world se calculan automáticamente cuando hay padre.
 */
export class Transform {
  // Transformación local (relativa al padre)
  private _localPosition: THREE.Vector3;
  private _localRotation: THREE.Euler;
  private _localScale: THREE.Vector3;

  // Transformación world (absoluta)
  private _worldPosition: THREE.Vector3;
  private _worldRotation: THREE.Euler;
  private _worldScale: THREE.Vector3;

  // Jerarquía
  private _parent?: Transform;
  private _dirty = true;

  // Callbacks para notificar cambios
  private _onChangeCallbacks: Array<() => void> = [];

  constructor(position?: [number, number, number]) {
    this._localPosition = new THREE.Vector3(...(position || [0, 0, 0]));
    this._localRotation = new THREE.Euler(0, 0, 0);
    this._localScale = new THREE.Vector3(1, 1, 1);

    this._worldPosition = this._localPosition.clone();
    this._worldRotation = this._localRotation.clone();
    this._worldScale = this._localScale.clone();
  }

  // --- Posición ---

  setPosition(x: number, y: number, z: number): void {
    this._localPosition.set(x, y, z);
    this.markDirty();
  }

  get localPosition(): THREE.Vector3 {
    return this._localPosition;
  }

  get worldPosition(): THREE.Vector3 {
    if (this._dirty) {
      this.updateWorldTransform();
    }
    return this._worldPosition;
  }

  // --- Rotación ---

  setRotation(x: number, y: number, z: number): void {
    this._localRotation.set(x, y, z);
    this.markDirty();
  }

  setRotationFromQuaternion(quaternion: THREE.Quaternion): void {
    this._localRotation.setFromQuaternion(quaternion);
    this.markDirty();
  }

  get localRotation(): THREE.Euler {
    return this._localRotation;
  }

  get worldRotation(): THREE.Euler {
    if (this._dirty) {
      this.updateWorldTransform();
    }
    return this._worldRotation;
  }

  // --- Escala ---

  setScale(x: number, y: number, z: number): void {
    this._localScale.set(x, y, z);
    this.markDirty();
  }

  setUniformScale(scale: number): void {
    this._localScale.set(scale, scale, scale);
    this.markDirty();
  }

  get localScale(): THREE.Vector3 {
    return this._localScale;
  }

  get worldScale(): THREE.Vector3 {
    if (this._dirty) {
      this.updateWorldTransform();
    }
    return this._worldScale;
  }

  // --- LookAt ---

  /**
   * Orienta el transform para que "mire" hacia un punto en el espacio.
   * Calcula la rotación necesaria desde la posición actual hacia el target.
   */
  lookAt(target: THREE.Vector3): void {
    // Crear una matriz temporal para calcular la rotación
    const matrix = new THREE.Matrix4();
    matrix.lookAt(this.worldPosition, target, new THREE.Vector3(0, 1, 0));

    // Extraer la rotación de la matriz
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(matrix);

    // Aplicar al local rotation
    this._localRotation.setFromQuaternion(quaternion);

    this.markDirty();
  }

  // --- Jerarquía ---

  setParent(parent: Transform | undefined): void {
    this._parent = parent;
    this.markDirty();
  }

  get parent(): Transform | undefined {
    return this._parent;
  }

  // --- Actualización de transforms ---

  private updateWorldTransform(): void {
    if (this._parent) {
      // Combinar con transform del padre
      const parentWorld = this._parent.worldPosition;
      const parentRotation = this._parent.worldRotation;
      const parentScale = this._parent.worldScale;

      // Aplicar rotación del padre a la posición local
      const rotatedPosition = this._localPosition.clone();
      rotatedPosition.applyEuler(parentRotation);
      
      // Aplicar escala del padre
      rotatedPosition.multiply(parentScale);
      
      // Sumar posición del padre
      this._worldPosition.copy(parentWorld).add(rotatedPosition);

      // Combinar rotaciones
      const parentQuat = new THREE.Quaternion().setFromEuler(parentRotation);
      const localQuat = new THREE.Quaternion().setFromEuler(this._localRotation);
      const worldQuat = parentQuat.multiply(localQuat);
      this._worldRotation.setFromQuaternion(worldQuat);

      // Combinar escalas (multiplicación componente a componente)
      this._worldScale.copy(this._localScale).multiply(parentScale);
    } else {
      // Sin padre: world = local
      this._worldPosition.copy(this._localPosition);
      this._worldRotation.copy(this._localRotation);
      this._worldScale.copy(this._localScale);
    }

    this._dirty = false;

    // Notificar cambios
    this.notifyChange();
  }

  private markDirty(): void {
    this._dirty = true;
    this.notifyChange();
  }

  // --- Sistema de callbacks ---

  onChange(callback: () => void): void {
    this._onChangeCallbacks.push(callback);
  }

  removeOnChange(callback: () => void): void {
    const index = this._onChangeCallbacks.indexOf(callback);
    if (index >= 0) {
      this._onChangeCallbacks.splice(index, 1);
    }
  }

  private notifyChange(): void {
    for (const callback of this._onChangeCallbacks) {
      callback();
    }
  }

  // --- Helpers ---

  /**
   * Copia los valores de otro transform (solo local, no jerarquía)
   */
  copyFrom(other: Transform): void {
    this._localPosition.copy(other._localPosition);
    this._localRotation.copy(other._localRotation);
    this._localScale.copy(other._localScale);
    this.markDirty();
  }

  /**
   * Obtiene la dirección "adelante" en world space
   */
  getForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(this.worldRotation);
    return forward.normalize();
  }

  /**
   * Obtiene la dirección "arriba" en world space
   */
  getUp(): THREE.Vector3 {
    const up = new THREE.Vector3(0, 1, 0);
    up.applyEuler(this.worldRotation);
    return up.normalize();
  }

  /**
   * Obtiene la dirección "derecha" en world space
   */
  getRight(): THREE.Vector3 {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(this.worldRotation);
    return right.normalize();
  }

  /**
   * Clona el transform (sin jerarquía)
   */
  clone(): Transform {
    const cloned = new Transform();
    cloned._localPosition.copy(this._localPosition);
    cloned._localRotation.copy(this._localRotation);
    cloned._localScale.copy(this._localScale);
    return cloned;
  }
}

export default Transform;
