import * as THREE from 'three';
import type { CameraViewComponent } from '../../../domain/ecs/components/CameraViewComponent';

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
