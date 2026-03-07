import type { ComponentBase } from '../core';

/** Shared fields for all geometry components. */
export interface GeometryComponentBase extends ComponentBase {
  castShadow: boolean;
  receiveShadow: boolean;
}

/** Box primitive geometry. */
export interface BoxGeometryComponent extends GeometryComponentBase {
  type: 'boxGeometry';
  width: number;
  height: number;
  depth: number;
}

/** Sphere primitive geometry. */
export interface SphereGeometryComponent extends GeometryComponentBase {
  type: 'sphereGeometry';
  radius: number;
  widthSegments: number;
  heightSegments: number;
}

/** Plane primitive geometry. */
export interface PlaneGeometryComponent extends GeometryComponentBase {
  type: 'planeGeometry';
  width: number;
  height: number;
}

/** Cylinder primitive geometry. */
export interface CylinderGeometryComponent extends GeometryComponentBase {
  type: 'cylinderGeometry';
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
}

/** Cone primitive geometry. */
export interface ConeGeometryComponent extends GeometryComponentBase {
  type: 'coneGeometry';
  radius: number;
  height: number;
  radialSegments: number;
}

/** Torus primitive geometry. */
export interface TorusGeometryComponent extends GeometryComponentBase {
  type: 'torusGeometry';
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
}

/** External mesh geometry resource. */
export interface FullMeshComponent extends GeometryComponentBase {
  type: 'fullMesh';
  url: string;
}

/** External custom geometry resource. */
export interface CustomGeometryComponent extends GeometryComponentBase {
  type: 'customGeometry';
  url: string;
}

/** Union of all geometry components. */
export type GeometryComponent =
  | BoxGeometryComponent
  | SphereGeometryComponent
  | PlaneGeometryComponent
  | CylinderGeometryComponent
  | ConeGeometryComponent
  | TorusGeometryComponent
  | FullMeshComponent
  | CustomGeometryComponent;
