import * as THREE from 'three';
import type { MeshGeometryFileData } from '@duckengine/core-v2';

/**
 * Builds a Three.js BufferGeometry from mesh-only data (positions, indices, optional normals/UVs).
 * Used for customGeometry component; no file loaders.
 */
export function buildBufferGeometryFromMeshData(data: MeshGeometryFileData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(data.positions), 3),
  );
  geometry.setIndex(data.indices);

  if (data.normals && data.normals.length === data.positions.length) {
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(data.normals), 3),
    );
  } else {
    geometry.computeVertexNormals();
  }

  if (data.uvs && data.uvs.length >= (data.positions.length / 3) * 2) {
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(data.uvs), 2),
    );
  }

  if (data.bounds) {
    const box = new THREE.Box3(
      new THREE.Vector3(data.bounds.minX, data.bounds.minY, data.bounds.minZ),
      new THREE.Vector3(data.bounds.maxX, data.bounds.maxY, data.bounds.maxZ),
    );
    geometry.boundingBox = box;
    geometry.boundingSphere = new THREE.Sphere();
    box.getBoundingSphere(geometry.boundingSphere);
  } else {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  return geometry;
}
