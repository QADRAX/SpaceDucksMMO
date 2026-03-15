import * as THREE from 'three';

/**
 * Recursively finds the first PerspectiveCamera in an Object3D subtree (depth-first).
 * Returns the root if it is a PerspectiveCamera, otherwise searches children.
 */
export function findCamera(
  root: THREE.Object3D | undefined,
): THREE.PerspectiveCamera | undefined {
  if (!root) return undefined;
  if ((root as THREE.PerspectiveCamera).isPerspectiveCamera) return root as THREE.PerspectiveCamera;
  for (const child of root.children) {
    const c = findCamera(child);
    if (c) return c;
  }
  return undefined;
}
