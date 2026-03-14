import type * as THREE from 'three';

/**
 * Recursively finds the first Mesh in an Object3D subtree (depth-first).
 * Returns the root if it is a Mesh, otherwise searches children.
 */
export function findMesh(root: THREE.Object3D | undefined): THREE.Mesh | undefined {
  if (!root) return undefined;
  if ((root as THREE.Mesh).isMesh) return root as THREE.Mesh;
  for (const child of root.children) {
    const m = findMesh(child);
    if (m) return m;
  }
  return undefined;
}
