import * as THREE from 'three';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import { TransformComponent } from './TransformComponent';

export interface CameraOptions {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
}

/**
 * CameraComponent wraps a THREE.PerspectiveCamera and keeps it synchronized
 * with a TransformComponent. The engine camera can be set to this component's
 * camera via `engine.setCamera(component.camera)`.
 */
export class CameraComponent {
  public camera: THREE.PerspectiveCamera;
  private transform: TransformComponent;

  constructor(transform: TransformComponent, opts: CameraOptions = {}) {
    this.transform = transform;
    const fov = opts.fov ?? 75;
    const aspect = opts.aspect ?? (typeof window !== 'undefined' ? (window.innerWidth / window.innerHeight) : 1);
    const near = opts.near ?? 0.1;
    const far = opts.far ?? 1000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // initialize camera from transform
    this.syncFromTransform();
  }

  /** Copy transform values into the underlying THREE.Camera */
  syncFromTransform() {
    this.camera.position.copy(this.transform.position);
    this.camera.rotation.copy(this.transform.rotation);
    // scale is not typically applied to cameras
  }

  /** Optionally copy camera transform back into transform component */
  syncToTransform() {
    this.transform.position.copy(this.camera.position);
    this.transform.rotation.copy(this.camera.rotation);
  }

  /** Convenience: activate this camera on the engine (sets as active camera) */
  activateOnEngine(engine: IRenderingEngine) {
    engine.setCamera(this.camera);
  }

  /** Update per-frame: keep camera synced from transform */
  update(dt: number) {
    this.syncFromTransform();
  }
}

export default CameraComponent;
