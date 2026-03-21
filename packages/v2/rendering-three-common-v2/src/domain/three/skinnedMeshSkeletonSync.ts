import type { Skeleton } from 'three';
import type { EntityState } from '@duckengine/core-v2';
import { worldMatrixColumnMajorFromTransform } from '@duckengine/core-v2';

/**
 * Copies ECS joint world matrices into Three.js skeleton bones (palette order) and updates GPU bone data.
 */
export function syncSkeletonBoneWorldMatricesFromEcsJoints(
  skeleton: Skeleton,
  jointsOrderedByPalette: readonly EntityState[],
): void {
  if (jointsOrderedByPalette.length !== skeleton.bones.length) return;
  for (let i = 0; i < jointsOrderedByPalette.length; i++) {
    const world = worldMatrixColumnMajorFromTransform(jointsOrderedByPalette[i].transform);
    skeleton.bones[i].matrixWorld.fromArray(world as unknown as number[]);
  }
  skeleton.update();
}
