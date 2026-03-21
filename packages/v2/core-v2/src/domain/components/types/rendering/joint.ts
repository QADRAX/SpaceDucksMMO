import type { ComponentBase } from '../core';

/**
 * Marks an entity as a skeletal joint. `jointIndex` is the skinning palette index
 * (0…N−1) and must match {@link MeshGeometryFileData.jointIndices} / weights on the mesh.
 * Hierarchy (parent/child entities) defines the bone tree; {@link SkinComponent.rigRootEntityId}
 * scopes which joints belong to a skinned mesh.
 */
export interface JointComponent extends ComponentBase<'joint', JointComponent> {
  jointIndex: number;
}
