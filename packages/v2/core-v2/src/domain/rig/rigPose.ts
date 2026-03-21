import type { EntityState } from '../entities/types';
import type { MeshGeometryFileData } from '../resources/meshGeometry';
import { MAT4_FLOATS, multiplyMat4ColumnMajor, worldMatrixColumnMajorFromTransform } from '../math/mat4';
import type { JointComponent } from '../components/types/rendering/joint';
import { getComponent } from '../entities/entity';

/**
 * Returns true if `entity` is `rigRoot` or a descendant in the entity parent chain.
 */
export function isEntityUnderRigRoot(entity: EntityState, rigRoot: EntityState): boolean {
  let current: EntityState | undefined = entity;
  while (current) {
    if (current.id === rigRoot.id) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Depth-first collection of every entity in the subtree rooted at `rigRoot` (including the root)
 * that has a `joint` component.
 */
export function collectJointEntitiesInRigSubtree(rigRoot: EntityState): EntityState[] {
  const out: EntityState[] = [];

  const visit = (e: EntityState) => {
    if (getComponent<JointComponent>(e, 'joint')) out.push(e);
    for (const c of e.children) visit(c);
  };

  visit(rigRoot);
  return out;
}

/**
 * Sorts joint entities by ascending {@link JointComponent.jointIndex} (stable for equal indices).
 */
export function sortJointEntitiesByJointIndex(entities: readonly EntityState[]): EntityState[] {
  return [...entities].sort((a, b) => {
    const ja = getComponent<JointComponent>(a, 'joint')?.jointIndex ?? Number.POSITIVE_INFINITY;
    const jb = getComponent<JointComponent>(b, 'joint')?.jointIndex ?? Number.POSITIVE_INFINITY;
    return ja - jb;
  });
}

/**
 * Collects joints under `rigRoot` and returns them sorted by `jointIndex`.
 */
export function collectSortedJointEntitiesForRig(rigRoot: EntityState): EntityState[] {
  return sortJointEntitiesByJointIndex(collectJointEntitiesInRigSubtree(rigRoot));
}

/**
 * Validates a joint palette: unique indices and dense `0 … N−1`.
 * Expects each entity to have a `joint` component.
 */
export function validateJointPaletteDense(jointEntities: readonly EntityState[]): string[] {
  const errors: string[] = [];
  if (jointEntities.length === 0) return errors;

  const indices: number[] = [];
  for (const e of jointEntities) {
    const j = getComponent<JointComponent>(e, 'joint');
    if (!j) {
      errors.push(`Entity '${e.id}' is missing a joint component in joint palette validation.`);
      continue;
    }
    if (!Number.isInteger(j.jointIndex) || j.jointIndex < 0) {
      errors.push(`Entity '${e.id}' has invalid jointIndex ${j.jointIndex} (expected non-negative integer).`);
    } else {
      indices.push(j.jointIndex);
    }
  }

  const n = indices.length;
  if (n !== jointEntities.length) {
    return errors;
  }

  if (new Set(indices).size !== n) {
    errors.push('Joint palette has duplicate jointIndex values.');
  }

  const sorted = [...indices].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i) {
      errors.push(
        `Joint indices are not dense 0…${n - 1}: expected ${i} at rank ${i}, found ${sorted[i]}.`,
      );
      break;
    }
  }

  return errors;
}

/**
 * Ensures every joint entity lives under `rigRoot` in the hierarchy.
 */
export function validateJointEntitiesDescendFromRig(
  rigRoot: EntityState,
  jointEntities: readonly EntityState[],
): string[] {
  const errors: string[] = [];
  for (const e of jointEntities) {
    if (!isEntityUnderRigRoot(e, rigRoot)) {
      errors.push(`Joint entity '${e.id}' is not under rig root '${rigRoot.id}'.`);
    }
  }
  return errors;
}

/**
 * Validates mesh skin / skinning attributes against a joint count `N` (palette size).
 */
export function validateMeshSkinDataAgainstJointCount(
  mesh: MeshGeometryFileData,
  jointCount: number,
): string[] {
  const errors: string[] = [];

  if (jointCount === 0) {
    if (mesh.skin?.inverseBindMatrices?.length) {
      errors.push('Mesh has inverseBindMatrices but joint count is 0.');
    }
    if (mesh.jointIndices?.length) {
      errors.push('Mesh has jointIndices but joint count is 0.');
    }
    if (mesh.jointWeights?.length) {
      errors.push('Mesh has jointWeights but joint count is 0.');
    }
    return errors;
  }

  const ibm = mesh.skin?.inverseBindMatrices;
  if (ibm !== undefined) {
    if (ibm.length !== jointCount * MAT4_FLOATS) {
      errors.push(
        `inverseBindMatrices length ${ibm.length} does not match joint count ${jointCount} (expected ${jointCount * MAT4_FLOATS} floats).`,
      );
    }
  }

  const ji = mesh.jointIndices;
  if (ji !== undefined) {
    if (ji.length % 4 !== 0) {
      errors.push(`jointIndices length ${ji.length} is not a multiple of 4.`);
    }
    for (let v = 0; v < ji.length; v++) {
      const idx = ji[v];
      if (!Number.isInteger(idx) || idx < 0 || idx >= jointCount) {
        errors.push(
          `jointIndices[${v}] = ${idx} is out of range for joint palette size ${jointCount}.`,
        );
        break;
      }
    }
  }

  const jw = mesh.jointWeights;
  if (jw !== undefined && ji !== undefined && jw.length !== ji.length) {
    errors.push(`jointWeights length ${jw.length} does not match jointIndices length ${ji.length}.`);
  }

  return errors;
}

/**
 * Full skin ↔ rig ↔ mesh consistency check for a skinned setup.
 */
export function validateRigSkinMeshCoherence(
  rigRoot: EntityState,
  mesh: MeshGeometryFileData,
  sortedJointEntities: readonly EntityState[],
): string[] {
  const errors: string[] = [];
  errors.push(...validateJointEntitiesDescendFromRig(rigRoot, sortedJointEntities));
  errors.push(...validateJointPaletteDense(sortedJointEntities));

  const jointCount = sortedJointEntities.length;
  for (let i = 0; i < sortedJointEntities.length; i++) {
    const j = getComponent<JointComponent>(sortedJointEntities[i], 'joint');
    if (j && j.jointIndex !== i) {
      errors.push(
        `Sorted joint at palette slot ${i} has jointIndex ${j.jointIndex} (expected ${i} for dense palettes).`,
      );
      break;
    }
  }

  errors.push(...validateMeshSkinDataAgainstJointCount(mesh, jointCount));
  return errors;
}

/**
 * Computes skin matrices (column-major, `jointCount × 16` floats) for a rig already ordered
 * by palette index 0…N−1. Uses `skinMatrix = jointWorld * inverseBindMatrix` per joint.
 */
export function computeSkinMatricesColumnMajor(
  jointEntitiesOrderedByPalette: readonly EntityState[],
  inverseBindMatrices: readonly number[],
): readonly number[] {
  const jc = jointEntitiesOrderedByPalette.length;
  if (inverseBindMatrices.length !== jc * MAT4_FLOATS) {
    throw new Error(
      `inverseBindMatrices length ${inverseBindMatrices.length} does not match joint count ${jc} (expected ${jc * MAT4_FLOATS}).`,
    );
  }

  const out = new Array<number>(jc * MAT4_FLOATS);
  for (let j = 0; j < jc; j++) {
    const world = worldMatrixColumnMajorFromTransform(jointEntitiesOrderedByPalette[j].transform);
    const skin = multiplyMat4ColumnMajor(world, inverseBindMatrices, j * MAT4_FLOATS);
    for (let k = 0; k < MAT4_FLOATS; k++) out[j * MAT4_FLOATS + k] = skin[k];
  }
  return out;
}
