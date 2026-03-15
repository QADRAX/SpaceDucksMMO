/**
 * Domain: apply transform definition to entity.
 * Uses core-v2 transform API.
 */
import { setPosition, setRotation, setScale } from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { Vec3Like } from './sceneDefinition';

/**
 * Applies transform definition (position, rotation, scale) to entity.
 */
export function applyTransformToEntity(
  entity: EntityState,
  transform: { position?: Vec3Like; rotation?: Vec3Like; scale?: Vec3Like },
): void {
  const t = entity.transform;
  if (transform.position) {
    setPosition(t, transform.position.x, transform.position.y, transform.position.z);
  }
  if (transform.rotation) {
    setRotation(t, transform.rotation.x, transform.rotation.y, transform.rotation.z);
  }
  if (transform.scale) {
    setScale(t, transform.scale.x, transform.scale.y, transform.scale.z);
  }
}
