/**
 * Syncs ECS transform3d (world TRS) to a Three.js Object3D.
 * - Active pose → writes TRS.
 * - Component present but disabled (out of space) → `visible = false`.
 * - No transform3d at all (e.g. ambientLight) → leave visibility alone.
 */
import type * as THREE from 'three';
import type { EntityState } from '@duckengine/core-v2';
import {
  getPosition,
  getRotation,
  getScale,
  getTransform3d,
  hasTransform3d,
} from '@duckengine/core-v2';

export function syncTransformToObject3D(
  entity: EntityState,
  object3D: THREE.Object3D,
): void {
  const t = getTransform3d(entity);
  if (!t) {
    if (hasTransform3d(entity)) {
      object3D.visible = false;
    }
    return;
  }
  const wp = getPosition(t);
  const wr = getRotation(t);
  const ws = getScale(t);
  object3D.position.set(wp.x, wp.y, wp.z);
  object3D.rotation.order = 'YXZ';
  object3D.rotation.set(wr.x, wr.y, wr.z);
  object3D.scale.set(ws.x, ws.y, ws.z);
  // Re-enter space (lights/cameras). Meshes may still be gated by MaterialFeature.
  object3D.visible = true;
}
