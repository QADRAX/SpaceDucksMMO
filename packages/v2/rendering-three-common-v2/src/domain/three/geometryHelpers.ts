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
  SkinComponent,
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

/**
 * Builds a cache key so we only rebuild geometry when the component actually changed.
 * For customGeometry, include meshDataLoaded so we rebuild when resource loads.
 * When `entity` is passed, includes `skin.rigRootEntityId` so Mesh ↔ SkinnedMesh transitions reconcile.
 */
export function geometryKey(
  entity: EntityState | undefined,
  comp: GeometryComponent,
  meshData: MeshGeometryFileData | null | undefined = undefined,
): string {
  const skin = entity ? getComponent<SkinComponent>(entity, 'skin') : undefined;
  const skinPart = skin ? `:skin:${skin.rigRootEntityId}` : '';
  const base = `${comp.type}:${comp.castShadow}:${comp.receiveShadow}:${skinPart}:`;
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
      return base + (comp.mesh?.key ?? '') + (meshData ? ':loaded' : ':pending');
    default:
      return base;
  }
}
