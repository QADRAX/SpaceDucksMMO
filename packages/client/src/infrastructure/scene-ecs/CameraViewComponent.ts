import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Componente que define una cámara 3D.
 * La posición/rotación viene del Transform de la entity.
 */
export class CameraViewComponent extends Component {
  readonly type = 'cameraView';
  readonly metadata: ComponentMetadata = {
    type: 'cameraView',
    unique: true,
    requires: [], // Transform siempre existe
    conflicts: ['geometry', 'shaderMaterial'] // Cámara no puede tener geometría visible
  };

  private _fov: number;
  private _near: number;
  private _far: number;
  private _aspect: number;

  constructor(params: { fov?: number; near?: number; far?: number; aspect?: number }) {
    super();
    this._fov = params.fov ?? 75;
    this._near = params.near ?? 0.1;
    this._far = params.far ?? 1000;
    this._aspect = params.aspect ?? (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1);
  }

  // --- Propiedades reactivas ---

  get fov(): number {
    return this._fov;
  }

  set fov(value: number) {
    this._fov = value;
    this.notifyChanged();
  }

  get near(): number {
    return this._near;
  }

  set near(value: number) {
    this._near = value;
    this.notifyChanged();
  }

  get far(): number {
    return this._far;
  }

  set far(value: number) {
    this._far = value;
    this.notifyChanged();
  }

  get aspect(): number {
    return this._aspect;
  }

  set aspect(value: number) {
    this._aspect = value;
    this.notifyChanged();
  }

  /**
   * Crea la cámara de THREE.js.
   * La posición/rotación se sincroniza desde Transform por el RenderSyncSystem.
   */
  createThreeCamera(): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(this._fov, this._aspect, this._near, this._far);
  }
}

export default CameraViewComponent;
