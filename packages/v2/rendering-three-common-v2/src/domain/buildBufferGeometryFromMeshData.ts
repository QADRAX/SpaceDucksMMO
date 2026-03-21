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

  const ji = data.jointIndices;
  const jw = data.jointWeights;
  if (ji && jw && ji.length === jw.length && ji.length % 4 === 0) {
    let maxIdx = 0;
    for (let i = 0; i < ji.length; i++) {
      const v = ji[i]!;
      if (v > maxIdx) maxIdx = v;
    }
    const useUint32 = maxIdx > 65535;
    geometry.setAttribute(
      'skinIndex',
      useUint32
        ? new three.Uint32BufferAttribute(new Uint32Array(ji as unknown as ArrayLike<number>), 4)
        : new three.Uint16BufferAttribute(new Uint16Array(ji as unknown as ArrayLike<number>), 4),
    );
    geometry.setAttribute(
      'skinWeight',
      new three.Float32BufferAttribute(new Float32Array(jw as unknown as ArrayLike<number>), 4),
    );
  }

  return geometry;
}
