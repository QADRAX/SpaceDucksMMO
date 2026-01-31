import * as THREE from 'three';
import type { CameraViewComponent } from '@duckengine/ecs';

export class CameraFactory {
  static build(cameraView: CameraViewComponent): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(
      cameraView.fov,
      cameraView.aspect,
      cameraView.near,
      cameraView.far
    );
  }
}
