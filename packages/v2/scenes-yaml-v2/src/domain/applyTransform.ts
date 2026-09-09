/**
 * Domain: apply transform definition by ensuring transform3d and setting locals.
 */
import {
  addComponent,
  createComponent,
  getTransform3d,
  setPosition,
  setRotation,
  setScale,
} from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { Vec3Like } from './sceneDefinition';

/**
 * Ensures transform3d on the entity and applies position/rotation/scale locals.
 */
export function applyTransformToEntity(
  entity: EntityState,
  transform: { position?: Vec3Like; rotation?: Vec3Like; scale?: Vec3Like },
): void {
  let state = getTransform3d(entity);
  if (!state) {
    addComponent(entity, createComponent('transform3d'));
    state = getTransform3d(entity);
  }
  if (!state) return;

  if (transform.position) {
    setPosition(state, transform.position.x, transform.position.y, transform.position.z);
  }
  if (transform.rotation) {
    setRotation(state, transform.rotation.x, transform.rotation.y, transform.rotation.z);
  }
  if (transform.scale) {
    setScale(state, transform.scale.x, transform.scale.y, transform.scale.z);
  }
}
