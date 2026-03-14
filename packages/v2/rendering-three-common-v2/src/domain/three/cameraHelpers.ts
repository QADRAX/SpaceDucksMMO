import type { CameraViewComponent } from '@duckengine/core-v2';

/** Cache key for camera params so we only update when they actually change. */
export function cameraKey(cam: CameraViewComponent): string {
  return `${cam.fov}:${cam.aspect ?? 1}:${cam.near}:${cam.far}`;
}
