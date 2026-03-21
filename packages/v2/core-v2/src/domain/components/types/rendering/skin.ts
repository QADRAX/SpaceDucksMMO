import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/**
 * Binds a skinned mesh (customGeometry + mesh resource with joint data) to a skeleton resource.
 * Vertex `jointIndices` in {@link MeshGeometryFileData} index into {@link SkeletonData.jointEntityIds}.
 */
export interface SkinComponent extends ComponentBase<'skin', SkinComponent> {
    skeleton: ResourceRef<'skeleton'>;
}
