import type * as THREE from 'three';

export interface PerspectiveCameraParams {
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

/**
 * Creates a Three.js PerspectiveCamera from projection params.
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function createPerspectiveCameraFromParams(
  params: PerspectiveCameraParams,
  three: typeof import('three'),
): THREE.PerspectiveCamera {
  return new three.PerspectiveCamera(
    params.fov,
    params.aspect ?? 1,
    params.near,
    params.far,
  );
}

/**
 * Updates an existing PerspectiveCamera with new projection params.
 */
export function applyPerspectiveCameraParams(
  camera: THREE.PerspectiveCamera,
  params: PerspectiveCameraParams,
): void {
  camera.fov = params.fov;
  camera.aspect = params.aspect ?? 1;
  camera.near = params.near;
  camera.far = params.far;
  camera.updateProjectionMatrix();
}
