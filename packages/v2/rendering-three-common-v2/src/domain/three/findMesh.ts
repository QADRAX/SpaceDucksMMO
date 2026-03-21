import type { Mesh, Object3D, SkinnedMesh } from 'three';

/**
 * Recursively finds the first Mesh or SkinnedMesh in an Object3D subtree (depth-first).
 * Returns the root if it is a mesh, otherwise searches children.
 */
export function findMesh(root: Object3D | undefined): Mesh | SkinnedMesh | undefined {
  if (!root) return undefined;
  const asMesh = root as Mesh;
  if (asMesh.isMesh) {
    const asSkinned = root as SkinnedMesh;
    if (asSkinned.isSkinnedMesh) return asSkinned;
    return asMesh;
  }
  for (const child of root.children) {
    const m = findMesh(child);
    if (m) return m;
  }
  return undefined;
}
