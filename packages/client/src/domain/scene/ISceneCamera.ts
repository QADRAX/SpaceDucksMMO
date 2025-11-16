import type { ISceneObject } from './ISceneObject';
import * as THREE from 'three';

/**
 * ISceneCamera — scene object that exposes a THREE.js camera.
 * Cameras are added to the scene like any other ISceneObject using addObject().
 * The scene manages which camera is active via setActiveCamera(id).
 * 
 * Camera configuration methods allow runtime adjustments without recreating
 * the camera instance, which is important for preserving rendering state.
 */
export interface ISceneCamera extends ISceneObject {
  /**
   * Returns the underlying THREE.Camera instance (PerspectiveCamera, OrthographicCamera, etc.).
   * The engine will use this camera for rendering when it is active.
   */
  getCamera(): THREE.Camera;

  /**
   * Update the camera's aspect ratio when the canvas size changes.
   * For PerspectiveCamera, this updates `camera.aspect` and calls `updateProjectionMatrix()`.
   * For OrthographicCamera, this should adjust left/right/top/bottom accordingly.
   * @param aspect - New aspect ratio (width / height)
   */
  updateAspect(aspect: number): void;

  /**
   * Set the field of view (FOV) for perspective cameras.
   * For orthographic cameras, this may be a no-op or adjust zoom.
   * @param fov - Field of view in degrees
   */
  setFov(fov: number): void;

  /**
   * Set the near and far clipping planes.
   * Objects closer than `near` or farther than `far` will be clipped.
   * @param near - Near clipping plane distance
   * @param far - Far clipping plane distance
   */
  setNearFar(near: number, far: number): void;

  /**
   * Point the camera to look at a specific position in world space.
   * @param target - World position to look at (THREE.Vector3 or [x, y, z])
   */
  lookAt(target: THREE.Vector3 | [number, number, number]): void;
}

export default ISceneCamera;
