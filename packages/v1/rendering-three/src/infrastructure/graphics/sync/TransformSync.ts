import * as THREE from "three";
import type { Entity } from "@duckengine/core";

/**
 * Sync ECS transform state into a THREE.Object3D.
 */
export function syncTransformToObject3D(
  entity: Entity,
  object3D: THREE.Object3D
): void {
  const t = entity.transform;
  const wp = t.worldPosition;
  const wr = t.worldRotation;
  const ws = t.worldScale;
  object3D.position.set(wp.x, wp.y, wp.z);
  object3D.rotation.order = "YXZ";
  object3D.rotation.set(wr.x, wr.y, wr.z);
  object3D.scale.set(ws.x, ws.y, ws.z);
}
