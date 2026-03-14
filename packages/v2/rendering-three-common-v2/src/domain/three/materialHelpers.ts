import {
  getComponent,
  hasAnyComponent,
  PLAIN_MATERIAL_COMPONENT_TYPES,
} from '@duckengine/core-v2';
import type { EntityState, MaterialComponent } from '@duckengine/core-v2';

export function getMaterialComponent(entity: EntityState): MaterialComponent | undefined {
  if (!hasAnyComponent(entity, PLAIN_MATERIAL_COMPONENT_TYPES)) return undefined;
  for (const t of PLAIN_MATERIAL_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && 'type' in c && c.type === t) return c as MaterialComponent;
  }
  return undefined;
}

/** Cache key so we only replace material when the component actually changed. */
export function materialKey(comp: MaterialComponent): string {
  const base = `${comp.type}:${comp.color ?? ''}:${comp.transparent}:${comp.opacity ?? 1}:`;
  const textureRefs = [
    (comp as { albedo?: { key?: string } }).albedo?.key,
    (comp as { normalMap?: { key?: string } }).normalMap?.key,
    (comp as { aoMap?: { key?: string } }).aoMap?.key,
    (comp as { roughnessMap?: { key?: string } }).roughnessMap?.key,
    (comp as { metallicMap?: { key?: string } }).metallicMap?.key,
    (comp as { envMap?: { key?: string } }).envMap?.key,
  ].join(',');
  if (comp.type === 'standardMaterial') return base + `${comp.metalness ?? 0}:${comp.roughness ?? 1}:${textureRefs}`;
  if (comp.type === 'basicMaterial') return base + `${comp.wireframe ?? false}:${textureRefs}`;
  if (comp.type === 'phongMaterial') return base + `${comp.specular ?? ''}:${comp.shininess ?? 30}:${textureRefs}`;
  if (comp.type === 'lambertMaterial') return base + `${comp.emissive ?? ''}:${textureRefs}`;
  return base + textureRefs;
}
