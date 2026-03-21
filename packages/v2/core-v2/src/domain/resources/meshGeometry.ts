/**
 * Canonical mesh geometry payload for the `mesh` resource geometry file.
 * Greenfield contract: importers map glTF (or other sources) into this shape.
 */

/** Axis-aligned bounds for culling / LOD. */
export interface MeshBounds {
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
}

/**
 * Per-joint inverse bind matrices, column-major 4×4 (16 floats per joint).
 * Vertex `jointIndices` select rows into the joint palette (same order as {@link JointComponent.jointIndex} under {@link SkinComponent.rigRootEntityId}).
 */
export interface MeshSkinInverseBindData {
    readonly inverseBindMatrices: readonly number[];
}

/**
 * One morph target: sparse deltas relative to the base mesh.
 * Each array, when present, must match base vertex count (positions length / 3).
 */
export interface MorphTargetDelta {
    readonly name?: string;
    /** Delta positions [dx,dy,dz, …], length = vertexCount × 3 */
    readonly positionDeltas?: readonly number[];
    /** Delta normals [dx,dy,dz, …], length = vertexCount × 3 */
    readonly normalDeltas?: readonly number[];
    /** Delta tangents (vec4), length = vertexCount × 4 */
    readonly tangentDeltas?: readonly number[];
}

/**
 * Full mesh geometry file shape (JSON or decoded binary — see ResourceLoader / coordinator).
 */
export interface MeshGeometryFileData {
    /** [x,y,z, …], length = vertexCount × 3 */
    readonly positions: readonly number[];
    /** Triangle indices [i,j,k, …], length multiple of 3 */
    readonly indices: readonly number[];
    /** [nx,ny,nz, …], length = vertexCount × 3 */
    readonly normals?: readonly number[];
    /** TEXCOORD_0 [u,v, …], length = vertexCount × 2 */
    readonly uvs?: readonly number[];
    /** TEXCOORD_1 (e.g. lightmaps) [u,v, …], length = vertexCount × 2 */
    readonly uvs2?: readonly number[];
    /** Tangents (glTF vec4: x,y,z, sign), length = vertexCount × 4 */
    readonly tangents?: readonly number[];
    /** Vertex COLOR_0 RGBA, length = vertexCount × 4 */
    readonly colors?: readonly number[];
    /** JOINTS_0: four indices per vertex into the joint palette (see joint components), length = vertexCount × 4 */
    readonly jointIndices?: readonly number[];
    /** WEIGHTS_0: four weights per vertex, length = vertexCount × 4 */
    readonly jointWeights?: readonly number[];
    /** IBM table for joints referenced by jointIndices (see skin + joint components on core-v2). */
    readonly skin?: MeshSkinInverseBindData;
    readonly morphTargets?: readonly MorphTargetDelta[];
    readonly bounds?: MeshBounds;
}
