import type { EntityState } from '@duckengine/core-v2';
import {
  ensureClean,
  applyQuatToVec,
  quatFromEulerYXZ,
  quatMul,
  quatNormalize,
} from '@duckengine/core-v2';

export interface LocalPose {
  pos: { x: number; y: number; z: number };
  rot: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

/**
 * Computes the local position, rotation and scale of `child` relative to `root`
 * by walking the hierarchy from child to root and composing transforms.
 * Returns identity pose if child is not under root.
 */
export function getLocalPoseRelativeTo(
  root: EntityState,
  child: EntityState
): LocalPose {
  const path: EntityState[] = [];
  let cur: EntityState | undefined = child;
  while (cur && cur !== root) {
    path.push(cur);
    cur = cur.parent;
  }
  if (cur !== root) {
    return {
      pos: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    };
  }
  let pos = { x: 0, y: 0, z: 0 };
  let rot: LocalPose['rot'] = { x: 0, y: 0, z: 0, w: 1 };
  let scale = { x: 1, y: 1, z: 1 };
  for (const node of path.reverse()) {
    ensureClean(node.transform);
    const lp = node.transform.localPosition;
    const lq = quatNormalize(quatFromEulerYXZ(node.transform.localRotation));
    const ls = node.transform.localScale;
    const rotated = applyQuatToVec(lp, rot);
    pos = {
      x: pos.x + rotated.x * scale.x,
      y: pos.y + rotated.y * scale.y,
      z: pos.z + rotated.z * scale.z,
    };
    rot = quatMul(rot, lq) as LocalPose['rot'];
    scale = { x: scale.x * ls.x, y: scale.y * ls.y, z: scale.z * ls.z };
  }
  return { pos, rot, scale };
}
