import type { Skeleton } from 'three';
import type { EntityState } from '@duckengine/core-v2';
import { worldMatrixColumnMajorFromTransform, getTransform3d } from '@duckengine/core-v2';

/**
 * Copies ECS joint world matrices into Three.js skeleton bones (palette order) and updates GPU bone data.
 */
export function syncSkeletonBoneWorldMatricesFromEcsJoints(
  skeleton: Skeleton,
  jointsOrderedByPalette: readonly EntityState[],
): void {
  if (jointsOrderedByPalette.length !== skeleton.bones.length) return;
  for (let i = 0; i < jointsOrderedByPalette.length; i++) {
    const state = getTransform3d(jointsOrderedByPalette[i]);
    if (!state) continue;
    const world = worldMatrixColumnMajorFromTransform(state);
    skeleton.bones[i].matrixWorld.fromArray(world as unknown as number[]);
  }
  skeleton.update();
}
