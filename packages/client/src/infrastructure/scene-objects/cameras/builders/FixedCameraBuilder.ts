import * as THREE from 'three';
import { CameraBody, CameraBodyConfig } from '../CameraBody';
import { LookAtComponent } from '../components/LookAtComponent';

export interface FixedCameraConfig extends CameraBodyConfig {
  /** Camera position */
  position?: THREE.Vector3;
  /** Target position to look at (optional) */
  lookAt?: THREE.Vector3;
}

/**
 * FixedCameraBuilder - Creates cameras with fixed position and rotation.
 * 
 * This builder creates a CameraBody with optional LookAtComponent for
 * static camera views (cutscenes, security cameras, strategic views).
 * 
 * @example
 * ```typescript
 * // Fixed camera looking at origin
 * const camera = FixedCameraBuilder.create('security-cam', {
 *   position: new THREE.Vector3(0, 20, 30),
 *   lookAt: new THREE.Vector3(0, 0, 0)
 * });
 * 
 * // Fixed camera with manual rotation (no lookAt)
 * const camera = FixedCameraBuilder.create('strategic-view', {
 *   position: new THREE.Vector3(0, 100, 0)
 * });
 * camera.getCamera().rotation.set(-Math.PI / 2, 0, 0); // Look down
 * ```
 */
export class FixedCameraBuilder {
  /**
   * Create a fixed camera with specified position and optional lookAt
   */
  static create(id: string, config: FixedCameraConfig = {}): CameraBody {
    const cameraBody = new CameraBody(id, {
      fov: config.fov,
      aspect: config.aspect,
      near: config.near,
      far: config.far,
      externalCamera: config.externalCamera
    });

    // Set camera position
    if (config.position) {
      cameraBody.getCamera().position.copy(config.position);
    }

    // Add look-at behavior if target provided
    if (config.lookAt) {
      cameraBody.addManagedComponent(
        new LookAtComponent({ target: config.lookAt }),
        {
          displayName: 'Look At',
          category: 'Camera Behavior',
          description: 'Makes camera always look at a target point',
          icon: '👁️'
        }
      );
    }

    return cameraBody;
  }

  /**
   * Create a top-down strategic view camera
   */
  static createTopDown(id: string, height: number = 50): CameraBody {
    const camera = FixedCameraBuilder.create(id, {
      position: new THREE.Vector3(0, height, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
      fov: 60,
      near: 0.1,
      far: 1000
    });

    return camera;
  }

  /**
   * Create a cinematic camera positioned for dramatic effect
   */
  static createCinematic(id: string, from: THREE.Vector3, lookAt: THREE.Vector3): CameraBody {
    return FixedCameraBuilder.create(id, {
      position: from,
      lookAt: lookAt,
      fov: 45, // Narrower FOV for cinematic look
      near: 0.1,
      far: 2000
    });
  }
}
