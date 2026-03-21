import type { EntityState } from '@duckengine/core-v2';
import { getComponent } from '@duckengine/core-v2';
import type { CameraOrthographicComponent, CameraPerspectiveComponent } from '@duckengine/core-v2';

/** Cache key for camera params so we only update when they actually change. */
export function cameraKey(entity: EntityState): string {
  const p = getComponent<CameraPerspectiveComponent>(entity, 'cameraPerspective');
  if (p) {
    return `p:${p.fov}:${p.aspect ?? 1}:${p.near}:${p.far}`;
  }
  const o = getComponent<CameraOrthographicComponent>(entity, 'cameraOrthographic');
  if (o) {
    return `o:${o.halfHeight}:${o.aspect ?? 1}:${o.near}:${o.far}`;
  }
  return '';
}
