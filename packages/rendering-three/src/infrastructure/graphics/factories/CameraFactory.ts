// @ts-ignore
import * as THREE from "three/webgpu";
import type { CameraViewComponent } from '@duckengine/core';

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
