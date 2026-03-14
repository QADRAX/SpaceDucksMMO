import * as THREE from 'three';
import type { GeometryComponent, MeshGeometryFileData } from '@duckengine/core-v2';
import { buildBufferGeometryFromMeshData } from './buildBufferGeometryFromMeshData';

/**
 * Builds Three.js BufferGeometry from a geometry component (primitive or customGeometry).
 * For customGeometry, meshData must be provided (resolved by caller).
 */
export function geometryFromComponent(
  comp: GeometryComponent,
  meshData: MeshGeometryFileData | null,
): THREE.BufferGeometry {
  switch (comp.type) {
    case 'boxGeometry':
      return new THREE.BoxGeometry(comp.width, comp.height, comp.depth);
    case 'sphereGeometry':
      return new THREE.SphereGeometry(
        comp.radius,
        comp.widthSegments,
        comp.heightSegments,
      );
    case 'planeGeometry':
      return new THREE.PlaneGeometry(comp.width, comp.height);
    case 'cylinderGeometry':
      return new THREE.CylinderGeometry(
        comp.radiusTop,
        comp.radiusBottom,
        comp.height,
        comp.radialSegments,
      );
    case 'coneGeometry':
      return new THREE.ConeGeometry(comp.radius, comp.height, comp.radialSegments);
    case 'torusGeometry':
      return new THREE.TorusGeometry(
        comp.radius,
        comp.tube,
        comp.radialSegments,
        comp.tubularSegments,
      );
    case 'customGeometry':
      if (meshData) {
        return buildBufferGeometryFromMeshData(meshData);
      }
      return new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(0), 3),
      );
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}
