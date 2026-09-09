/**
 * Syncs ECS transform3d (world position, rotation, scale) to a Three.js Object3D.
 * No-op when the entity has no transform3d component.
 */
import type * as THREE from 'three';
import type { EntityState } from '@duckengine/core-v2';
import { getPosition, getRotation, getScale, getTransform3d } from '@duckengine/core-v2';

export function syncTransformToObject3D(
  entity: EntityState,
  object3D: THREE.Object3D,
): void {
  const t = getTransform3d(entity);
  if (!t) return;
  const wp = getPosition(t);
  const wr = getRotation(t);
  const ws = getScale(t);
  object3D.position.set(wp.x, wp.y, wp.z);
  object3D.rotation.order = 'YXZ';
  object3D.rotation.set(wr.x, wr.y, wr.z);
  object3D.scale.set(ws.x, ws.y, ws.z);
}
