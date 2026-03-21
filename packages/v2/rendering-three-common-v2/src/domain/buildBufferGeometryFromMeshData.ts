import type * as THREE from 'three';
import type { MeshGeometryFileData } from '@duckengine/core-v2';

/**
 * Builds a Three.js BufferGeometry from mesh-only data (positions, indices, optional normals/UVs).
 * Used for customGeometry component; no file loaders.
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function buildBufferGeometryFromMeshData(
  data: MeshGeometryFileData,
  three: typeof import('three'),
): THREE.BufferGeometry {
  const geometry = new three.BufferGeometry();

  geometry.setAttribute(
    'position',
    new three.BufferAttribute(new Float32Array(data.positions), 3),
  );
  geometry.setIndex(Array.from(data.indices));

  if (data.normals && data.normals.length === data.positions.length) {
    geometry.setAttribute(
      'normal',
      new three.BufferAttribute(new Float32Array(data.normals), 3),
    );
  } else {
    geometry.computeVertexNormals();
  }

  if (data.uvs && data.uvs.length >= (data.positions.length / 3) * 2) {
    geometry.setAttribute(
      'uv',
      new three.BufferAttribute(new Float32Array(data.uvs), 2),
    );
  }

  if (data.bounds) {
    const box = new three.Box3(
      new three.Vector3(data.bounds.minX, data.bounds.minY, data.bounds.minZ),
      new three.Vector3(data.bounds.maxX, data.bounds.maxY, data.bounds.maxZ),
    );
    geometry.boundingBox = box;
    geometry.boundingSphere = new three.Sphere();
    box.getBoundingSphere(geometry.boundingSphere);
  } else {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  return geometry;
}
