import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/** Shared fields for all geometry components. */
export interface GeometryComponentBase<
  TType extends 'boxGeometry' | 'sphereGeometry' | 'planeGeometry' | 'cylinderGeometry' | 'coneGeometry' | 'torusGeometry' | 'customGeometry' | 'fullMesh' = 'boxGeometry' | 'sphereGeometry' | 'planeGeometry' | 'cylinderGeometry' | 'coneGeometry' | 'torusGeometry' | 'customGeometry' | 'fullMesh',
  TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
  castShadow: boolean;
  receiveShadow: boolean;
}

/** Box primitive geometry. */
export interface BoxGeometryComponent extends GeometryComponentBase<'boxGeometry', BoxGeometryComponent> {
  width: number;
  height: number;
  depth: number;
}

/** Sphere primitive geometry. */
export interface SphereGeometryComponent extends GeometryComponentBase<'sphereGeometry', SphereGeometryComponent> {
  radius: number;
  widthSegments: number;
  heightSegments: number;
}

/** Plane primitive geometry. */
export interface PlaneGeometryComponent extends GeometryComponentBase<'planeGeometry', PlaneGeometryComponent> {
  width: number;
  height: number;
}

/** Cylinder primitive geometry. */
export interface CylinderGeometryComponent extends GeometryComponentBase<'cylinderGeometry', CylinderGeometryComponent> {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
}

/** Cone primitive geometry. */
export interface ConeGeometryComponent extends GeometryComponentBase<'coneGeometry', ConeGeometryComponent> {
  radius: number;
  height: number;
  radialSegments: number;
}

/** Torus primitive geometry. */
export interface TorusGeometryComponent extends GeometryComponentBase<'torusGeometry', TorusGeometryComponent> {
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
}

/** External mesh geometry resource (GLB/GLTF). */
export interface FullMeshComponent extends GeometryComponentBase<'fullMesh', FullMeshComponent> {
  /** Reference to the mesh resource. */
  mesh: ResourceRef<'mesh'>;
}

/** External custom geometry resource. */
export interface CustomGeometryComponent extends GeometryComponentBase<'customGeometry', CustomGeometryComponent> {
  /** Reference to the custom geometry resource. */
  mesh: ResourceRef<'mesh'>;
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
