import * as THREE from 'three';
import type { GeometryComponent } from '../../../domain/ecs/components/GeometryComponent';

export class GeometryFactory {
  static build(params: GeometryComponent['parameters']): THREE.BufferGeometry {
    switch (params.type) {
      case 'sphere':
        return new THREE.SphereGeometry(
          params.radius,
          params.widthSegments ?? 32,
          params.heightSegments ?? 16
        );
      case 'box':
        return new THREE.BoxGeometry(params.width, params.height, params.depth);
      case 'plane':
        return new THREE.PlaneGeometry(
          params.width,
          params.height,
          params.widthSegments ?? 1,
          params.heightSegments ?? 1
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          params.radiusTop,
          params.radiusBottom,
          params.height,
          params.radialSegments ?? 16
        );
      case 'cone':
        return new THREE.ConeGeometry(
          params.radius,
          params.height,
          params.radialSegments ?? 16
        );
      case 'torus':
        return new THREE.TorusGeometry(
          params.radius,
          params.tube,
          params.radialSegments ?? 16,
          params.tubularSegments ?? 48
        );
      case 'custom':
        console.warn(
          `[GeometryFactory] custom geometry key='${params.key}' not implemented; using unit box`
        );
        return new THREE.BoxGeometry(1, 1, 1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }
}
