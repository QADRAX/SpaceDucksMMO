import type * as THREE from 'three';
import { SkinnedMesh } from 'three';

function isMaterialWithSkinning(
  material: THREE.Material,
): material is THREE.Material & { skinning: boolean } {
  return 'skinning' in material && typeof (material as { skinning?: unknown }).skinning === 'boolean';
}

/**
 * Three.js skinned meshes need materials with `skinning: true` so the shader uses bone matrices.
 */
export function applySkinningMaterialIfSkinnedMesh(mesh: THREE.Mesh, material: THREE.Material): void {
  if (!(mesh instanceof SkinnedMesh)) return;
  if (!isMaterialWithSkinning(material)) return;
  material.skinning = true;
}

/**
 * Applies cast/receive shadow flags to a Three.js Mesh.
 */
export function applyShadow(mesh: THREE.Mesh, cast: boolean, receive: boolean): void {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
}

/**
 * Applies UV repeat and offset to all texture map properties on a material that support them.
 */
export function applyTilingToMaterial(
  material: THREE.Material,
  repeatU: number,
  repeatV: number,
  offsetU: number,
  offsetV: number,
): void {
  const mat = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(mat)) {
    const value = mat[key];
    if (value && typeof value === 'object' && 'repeat' in value && 'offset' in value) {
      const tex = value as THREE.Texture;
      tex.repeat.set(repeatU, repeatV);
      tex.offset.set(offsetU, offsetV);
    }
  }
}

/**
 * Disposes a mesh's geometry and material. Use when removing a mesh from the scene.
 */
export function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

/**
 * Disposes a skinned mesh: skeleton GPU resources, geometry, and material.
 */
export function disposeSkinnedMesh(mesh: THREE.SkinnedMesh): void {
  mesh.skeleton.dispose();
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

/** Disposes either a plain mesh or a skinned mesh (skeleton + geometry + material). */
export function disposeRenderableMesh(mesh: THREE.Mesh): void {
  if (mesh instanceof SkinnedMesh) {
    disposeSkinnedMesh(mesh);
  } else {
    disposeMesh(mesh);
  }
}
