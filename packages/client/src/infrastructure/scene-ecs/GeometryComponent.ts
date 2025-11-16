import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Parámetros para diferentes tipos de geometría.
 */
export type GeometryParameters = 
  | { type: 'sphere'; radius: number; widthSegments?: number; heightSegments?: number }
  | { type: 'box'; width: number; height: number; depth: number }
  | { type: 'plane'; width: number; height: number; widthSegments?: number; heightSegments?: number }
  | { type: 'cylinder'; radiusTop: number; radiusBottom: number; height: number; radialSegments?: number }
  | { type: 'cone'; radius: number; height: number; radialSegments?: number }
  | { type: 'torus'; radius: number; tube: number; radialSegments?: number; tubularSegments?: number }
  | { type: 'custom'; geometry: THREE.BufferGeometry };

/**
 * Componente que define la geometría 3D de una entity.
 * Requiere que la entity tenga Transform (ya integrado).
 */
export class GeometryComponent extends Component {
  readonly type = 'geometry';
  readonly metadata: ComponentMetadata = {
    type: 'geometry',
    unique: true,
    requires: [], // Transform siempre existe en Entity
    conflicts: ['skybox'] // No puedes tener geometría y skybox
  };

  private _parameters: GeometryParameters;

  constructor(parameters: GeometryParameters) {
    super();
    this._parameters = parameters;
  }

  get parameters(): GeometryParameters {
    return this._parameters;
  }

  set parameters(value: GeometryParameters) {
    this._parameters = value;
    this.notifyChanged();
  }

  /**
   * Crea la geometría de THREE.js basándose en los parámetros.
   */
  createThreeGeometry(): THREE.BufferGeometry {
    const params = this._parameters;

    switch (params.type) {
      case 'sphere':
        return new THREE.SphereGeometry(
          params.radius,
          params.widthSegments || 32,
          params.heightSegments || 16
        );

      case 'box':
        return new THREE.BoxGeometry(params.width, params.height, params.depth);

      case 'plane':
        return new THREE.PlaneGeometry(
          params.width,
          params.height,
          params.widthSegments || 1,
          params.heightSegments || 1
        );

      case 'cylinder':
        return new THREE.CylinderGeometry(
          params.radiusTop,
          params.radiusBottom,
          params.height,
          params.radialSegments || 32
        );

      case 'cone':
        return new THREE.ConeGeometry(
          params.radius,
          params.height,
          params.radialSegments || 32
        );

      case 'torus':
        return new THREE.TorusGeometry(
          params.radius,
          params.tube,
          params.radialSegments || 16,
          params.tubularSegments || 100
        );

      case 'custom':
        return params.geometry;

      default:
        throw new Error(`Unknown geometry type`);
    }
  }

  /**
   * Calcula el radio efectivo para geometrías esféricas (útil para órbitas, colisiones, etc.)
   */
  getEffectiveRadius(scale: THREE.Vector3): number {
    const params = this._parameters;

    if (params.type === 'sphere') {
      // Aplicar escala (asumiendo escala uniforme en X)
      return params.radius * scale.x;
    }

    if (params.type === 'box') {
      // Para cajas, usar la mitad de la diagonal
      const halfDiagonal = Math.sqrt(
        params.width * params.width +
        params.height * params.height +
        params.depth * params.depth
      ) / 2;
      return halfDiagonal * scale.x;
    }

    // Para otras geometrías, calcular bounding sphere
    const geometry = this.createThreeGeometry();
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius || 1;
    geometry.dispose();
    return radius * scale.x;
  }
}

export default GeometryComponent;
