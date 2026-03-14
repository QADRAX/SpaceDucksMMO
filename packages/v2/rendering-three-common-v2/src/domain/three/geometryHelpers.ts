import {
  getComponent,
  hasAnyComponent,
  GEOMETRY_COMPONENT_TYPES,
} from '@duckengine/core-v2';
import type {
  EntityState,
  GeometryComponent,
  MeshGeometryFileData,
  CustomGeometryComponent,
} from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';

export function getGeometryComponent(entity: EntityState): GeometryComponent | undefined {
  if (!hasAnyComponent(entity, GEOMETRY_COMPONENT_TYPES)) return undefined;
  for (const t of GEOMETRY_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && c.type === t) return c as GeometryComponent;
  }
  return undefined;
}

export function getMeshDataForCustom(
  entity: EntityState,
  ctx: RenderContextThree,
): MeshGeometryFileData | null {
  const custom = getComponent<CustomGeometryComponent>(entity, 'customGeometry');
  if (!custom?.mesh) return null;
  return ctx.getMeshData(custom.mesh);
}

/** Builds a cache key so we only rebuild geometry when the component actually changed. */
export function geometryKey(comp: GeometryComponent): string {
  const base = `${comp.type}:${comp.castShadow}:${comp.receiveShadow}:`;
  switch (comp.type) {
    case 'boxGeometry':
      return base + `${comp.width}:${comp.height}:${comp.depth}`;
    case 'sphereGeometry':
      return base + `${comp.radius}:${comp.widthSegments}:${comp.heightSegments}`;
    case 'planeGeometry':
      return base + `${comp.width}:${comp.height}`;
    case 'cylinderGeometry':
      return base + `${comp.radiusTop}:${comp.radiusBottom}:${comp.height}:${comp.radialSegments}`;
    case 'coneGeometry':
      return base + `${comp.radius}:${comp.height}:${comp.radialSegments}`;
    case 'torusGeometry':
      return base + `${comp.radius}:${comp.tube}:${comp.radialSegments}:${comp.tubularSegments}`;
    case 'customGeometry':
      return base + (comp.mesh?.key ?? '');
    default:
      return base;
  }
}
