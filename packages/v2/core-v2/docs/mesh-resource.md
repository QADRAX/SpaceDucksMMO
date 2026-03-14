# Mesh resource (kind: `mesh`)

The **mesh** resource holds **geometry-only** data: a single mesh defined by vertices and indices (and optionally normals, UVs). It is **not** a full scene (no hierarchy, materials, or animations).

## Consumers

- **customGeometry** component: references a mesh resource for rendering (BufferGeometry).
- **trimeshCollider** component (physics-rapier): references the same mesh resource for collision (Rapier trimesh). Same resource can be used for both render and physics.

## File slots

| Slot        | Description |
|------------|-------------|
| `geometry` | Mesh-only file. When served as JSON, must match `MeshGeometryFileData` (see below). |
| `thumbnail`| Optional image for editor UI. |

## Scalar data

None (`MeshData` is empty). All data comes from the `geometry` file.

## Geometry file JSON schema (`MeshGeometryFileData`)

When the geometry file is JSON, the parsed content must follow this shape (exported from `@duckengine/core-v2`):

| Field       | Type       | Description |
|------------|------------|-------------|
| `positions`| `number[]` | Flat array [x, y, z, x, y, z, ...], length = vertexCount × 3. Required. |
| `indices`  | `number[]` | Triangle list [i0, j0, k0, i1, j1, k1, ...], length multiple of 3. Required. |
| `normals`  | `number[]` | Optional. Flat [x, y, z, ...], length = vertexCount × 3. |
| `uvs`      | `number[]` | Optional. Flat [u, v, u, v, ...], length = vertexCount × 2. |
| `bounds`   | `object`   | Optional AABB: `minX`, `minY`, `minZ`, `maxX`, `maxY`, `maxZ`. |

Example minimal JSON:

```json
{
  "positions": [0, 0, 0, 1, 0, 0, 0.5, 1, 0],
  "indices": [0, 1, 2]
}
```

## Pipeline

- **Authoring**: GLB/glTF or other DCC export can be **imported** and split: one mesh → one mesh resource (geometry file). Future: “GLB → ECS” importer extracts meshes and creates mesh resources.
- **Runtime**: Components reference the resource by `ResourceRef<'mesh'>`; the client resolves the resource and loads the `geometry` file to get positions/indices (and normals/UVs for render).
