import { Entity } from './Entity';
import * as THREE from 'three';
import { TransformComponent } from './TransformComponent';
import CameraComponent from './CameraComponent';
import RotationComponent from './RotationComponent';
import type { ISceneCamera } from '@client/domain/scene/ISceneCamera';

/**
 * CameraEntity — ISceneCamera implementation that wraps a CameraComponent.
 * Scenes add this via scene.addObject(cameraEntity) and activate it via
 * scene.setActiveCamera(id). No separate camera registration is needed.
 */
export class CameraEntity implements ISceneCamera {
  readonly id: string;
  readonly entity: Entity;
  readonly transform: TransformComponent;
  readonly cameraComponent: CameraComponent;

  constructor(id: string, opts?: { fov?: number; near?: number; far?: number; aspect?: number; rotationSpeed?: number }) {
    this.id = id;
    this.entity = new Entity(id);
    this.transform = new TransformComponent({ position: [0, 0, 5] });
    this.entity.addComponent(this.transform);
    this.cameraComponent = new CameraComponent(this.transform, {
      fov: opts?.fov,
      aspect: opts?.aspect,
      near: opts?.near,
      far: opts?.far,
    });
    
    // Optionally attach a RotationComponent to rotate the camera around its Y axis
    if (typeof opts?.rotationSpeed === 'number') {
      this.entity.addComponent(new RotationComponent(this.transform, opts.rotationSpeed));
    }
  }

  // --- ISceneObject lifecycle methods ---

  /** ISceneObject: add to three.js scene. Cameras have no visual representation, so this is a no-op. */
  addTo(scene: THREE.Scene): void {
    // Cameras don't add anything to the scene visually
  }

  /** ISceneObject: remove from three.js scene. */
  removeFrom(scene: THREE.Scene): void {
    // Nothing to remove
  }

  /** ISceneObject: dispose resources. */
  dispose(): void {
    // Camera instances are managed by Three.js; no explicit disposal needed here
  }

  /** ISceneObject: per-frame update. Updates entity components (e.g. rotation) then syncs camera from transform. */
  update(dt: number): void {
    // Update entity components first (e.g., RotationComponent which modifies the transform)
    this.entity.update(dt);
    // Then sync camera from transform
    this.cameraComponent.update(dt);
  }

  // --- ISceneCamera methods ---

  /** ISceneCamera: return the underlying THREE.Camera instance. */
  getCamera(): THREE.PerspectiveCamera {
    return this.cameraComponent.getCamera();
  }

  /** ISceneCamera: update aspect ratio and projection matrix. */
  updateAspect(aspect: number): void {
    const cam = this.cameraComponent.camera;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
  }

  /** ISceneCamera: set field of view in degrees. */
  setFov(fov: number): void {
    const cam = this.cameraComponent.camera;
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }

  /** ISceneCamera: set near and far clipping planes. */
  setNearFar(near: number, far: number): void {
    const cam = this.cameraComponent.camera;
    cam.near = near;
    cam.far = far;
    cam.updateProjectionMatrix();
  }

  /** ISceneCamera: point camera at target position in world space. */
  lookAt(target: THREE.Vector3 | [number, number, number]): void {
    const cam = this.cameraComponent.camera;
    if (Array.isArray(target)) {
      cam.lookAt(new THREE.Vector3(...target));
    } else {
      cam.lookAt(target);
    }
    // Optionally sync transform rotation back from camera if needed
    this.cameraComponent.syncToTransform();
  }
}

export default CameraEntity;
