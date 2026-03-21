import type { BufferGeometry, Bone, Matrix4, MeshStandardMaterial, Skeleton, SkinnedMesh } from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { EntityState, MeshGeometryFileData, SkinComponent } from '@duckengine/core-v2';

/** True when entity has `skin` and mesh data includes IBMs + joint attributes for GPU skinning. */
export function wantsSkinnedMesh(
  entity: EntityState,
  meshData: MeshGeometryFileData | null,
): meshData is MeshGeometryFileData {
  const skin = getComponent<SkinComponent>(entity, 'skin');
  if (!skin) return false;
  if (!meshData?.skin?.inverseBindMatrices?.length) return false;
  if (!meshData.jointIndices?.length || !meshData.jointWeights?.length) return false;
  const jc = meshData.skin.inverseBindMatrices.length / 16;
  return jc > 0 && meshData.skin.inverseBindMatrices.length === jc * 16;
}

export interface SkinnedMeshParts {
  readonly mesh: SkinnedMesh;
  readonly skeleton: Skeleton;
}

/**
 * Builds a {@link SkinnedMesh} and {@link Skeleton} from mesh resource data (inverse bind matrices).
 * Caller should `syncTransformToObject3D` then `mesh.bind(skeleton, mesh.matrixWorld)`.
 */
export function createSkinnedMeshParts(
  three: typeof import('three'),
  geom: BufferGeometry,
  material: MeshStandardMaterial,
  meshData: MeshGeometryFileData,
): SkinnedMeshParts {
  const jc = meshData.skin!.inverseBindMatrices.length / 16;
  const bones: Bone[] = [];
  for (let i = 0; i < jc; i++) {
    const b = new three.Bone();
    b.matrixAutoUpdate = false;
    bones.push(b);
  }
  const boneInverses: Matrix4[] = [];
  const ibm = meshData.skin!.inverseBindMatrices;
  for (let j = 0; j < jc; j++) {
    const m = new three.Matrix4();
    m.fromArray(ibm as unknown as number[], j * 16);
    boneInverses.push(m);
  }
  const skeleton = new three.Skeleton(bones, boneInverses);
  const mesh = new three.SkinnedMesh(geom, material);
  return { mesh, skeleton };
}
