import type * as THREE from 'three';
import type { GeometryComponent, MeshGeometryFileData } from '@duckengine/core-v2';
import { buildBufferGeometryFromMeshData } from './buildBufferGeometryFromMeshData';

/**
 * Builds Three.js BufferGeometry from a geometry component (primitive or customGeometry).
 * For customGeometry, meshData must be provided (resolved by caller).
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function geometryFromComponent(
  comp: GeometryComponent,
  meshData: MeshGeometryFileData | null,
  three: typeof import('three'),
): THREE.BufferGeometry {
  switch (comp.type) {
    case 'boxGeometry':
      return new three.BoxGeometry(comp.width, comp.height, comp.depth);
    case 'sphereGeometry':
      return new three.SphereGeometry(
        comp.radius,
        comp.widthSegments,
        comp.heightSegments,
      );
    case 'planeGeometry':
      return new three.PlaneGeometry(comp.width, comp.height);
    case 'cylinderGeometry':
      return new three.CylinderGeometry(
        comp.radiusTop,
        comp.radiusBottom,
        comp.height,
        comp.radialSegments,
      );
    case 'coneGeometry':
      return new three.ConeGeometry(comp.radius, comp.height, comp.radialSegments);
    case 'torusGeometry':
      return new three.TorusGeometry(
        comp.radius,
        comp.tube,
        comp.radialSegments,
        comp.tubularSegments,
      );
    case 'customGeometry':
      if (meshData) {
        return buildBufferGeometryFromMeshData(meshData, three);
      }
      return new three.BufferGeometry().setAttribute(
        'position',
        new three.BufferAttribute(new Float32Array(0), 3),
      );
    default:
      return new three.BoxGeometry(1, 1, 1);
  }
}
