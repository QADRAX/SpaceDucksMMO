import type * as THREE from 'three';
import type { EntityState } from '@duckengine/core-v2';
import { ensureClean } from '@duckengine/core-v2';

/**
 * Syncs ECS transform (world position, rotation, scale) to a Three.js Object3D.
 */
export function syncTransformToObject3D(
  entity: EntityState,
  object3D: THREE.Object3D,
): void {
  const t = entity.transform;
  ensureClean(t);
  const wp = t.worldPosition;
  const wr = t.worldRotation;
  const ws = t.worldScale;
  object3D.position.set(wp.x, wp.y, wp.z);
  object3D.rotation.order = 'YXZ';
  object3D.rotation.set(wr.x, wr.y, wr.z);
  object3D.scale.set(ws.x, ws.y, ws.z);
}
