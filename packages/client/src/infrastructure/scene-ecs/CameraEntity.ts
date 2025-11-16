import { Entity } from './Entity';
import * as THREE from 'three';
import { TransformComponent } from './TransformComponent';
import CameraComponent from './CameraComponent';
import RotationComponent from './RotationComponent';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

export class CameraEntity implements ISceneObject {
  readonly id: string;
  readonly entity: Entity;
  readonly transform: TransformComponent;
  readonly cameraComponent: CameraComponent;
  // ISceneObject requires addTo/removeFrom/update

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


  /** Scenes should register this camera during scene.setup using
   * `scene.registerCamera(id, camera)` or `scene.setActiveCamera(id)`.
   * CameraEntity does not perform registration itself.
   */
  // Intentionally no activate(...) method: the scene owns activation.

  /** ISceneObject: add to three.js scene. Camera has no visual representation to add, but keep lifecycle symmetric. */
  addTo(scene: THREE.Scene): void {
    // Nothing to add to scene for camera itself
  }

  /** ISceneObject: remove from three.js scene. */
  removeFrom(scene: THREE.Scene): void {
    // Nothing to remove
  }

  dispose(): void {
    // No disposable resources owned here (camera instances are managed by Three.js renderer)
  }

  update(dt: number) {
    // Update entity components first (e.g., RotationComponent which modifies the transform)
    this.entity.update(dt);
    // Then sync camera from transform
    this.cameraComponent.update(dt);
  }

  /** Allow external code (e.g. the scene) to obtain the camera instance. */
  getCamera(): THREE.PerspectiveCamera {
    return this.cameraComponent.getCamera();
  }
}

export default CameraEntity;
