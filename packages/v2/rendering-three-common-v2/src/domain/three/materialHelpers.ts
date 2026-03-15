import {
  getComponent,
  hasAnyComponent,
  PLAIN_MATERIAL_COMPONENT_TYPES,
} from '@duckengine/core-v2';
import type { EntityState, MaterialComponent } from '@duckengine/core-v2';
import type { TextureResolver } from '../renderContextThree';

export function getMaterialComponent(entity: EntityState): MaterialComponent | undefined {
  if (!hasAnyComponent(entity, PLAIN_MATERIAL_COMPONENT_TYPES)) return undefined;
  for (const t of PLAIN_MATERIAL_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && 'type' in c && c.type === t) return c as MaterialComponent;
  }
  return undefined;
}

/** True if material has texture refs that are not yet loaded. */
export function hasUnresolvedTextures(
  comp: MaterialComponent,
  getTexture?: TextureResolver,
): boolean {
  if (!getTexture) return false;
  const refs = [
    (comp as { albedo?: { key?: string; kind?: string } }).albedo,
    (comp as { normalMap?: { key?: string; kind?: string } }).normalMap,
    (comp as { aoMap?: { key?: string; kind?: string } }).aoMap,
    (comp as { roughnessMap?: { key?: string; kind?: string } }).roughnessMap,
    (comp as { metallicMap?: { key?: string; kind?: string } }).metallicMap,
    (comp as { envMap?: { key?: string; kind?: string } }).envMap,
  ].filter(Boolean) as Array<{ key?: string; kind?: string }>;
  return refs.some((r) => !getTexture(r as any));
}

/** Append texture resolution state so key changes when textures load (resource-loaded). */
function textureResolvedSuffix(
  comp: MaterialComponent,
  getTexture?: TextureResolver,
): string {
  if (!getTexture) return '';
  const refs = [
    (comp as { albedo?: { key?: string; kind?: string } }).albedo,
    (comp as { normalMap?: { key?: string; kind?: string } }).normalMap,
    (comp as { aoMap?: { key?: string; kind?: string } }).aoMap,
    (comp as { roughnessMap?: { key?: string; kind?: string } }).roughnessMap,
    (comp as { metallicMap?: { key?: string; kind?: string } }).metallicMap,
    (comp as { envMap?: { key?: string; kind?: string } }).envMap,
  ].filter(Boolean) as Array<{ key?: string; kind?: string }>;
  if (refs.length === 0) return '';
  const resolved = refs.map((r) => (getTexture(r as any) ? '1' : '0')).join('');
  return `:tx${resolved}`;
}

/** Cache key so we only replace material when the component actually changed.
 * When getTexture is provided, includes texture resolution state so we re-sync when textures load. */
export function materialKey(
  comp: MaterialComponent,
  getTexture?: TextureResolver,
): string {
  const base = `${comp.type}:${comp.color ?? ''}:${comp.transparent}:${comp.opacity ?? 1}:`;
  const textureRefs = [
    (comp as { albedo?: { key?: string } }).albedo?.key,
    (comp as { normalMap?: { key?: string } }).normalMap?.key,
    (comp as { aoMap?: { key?: string } }).aoMap?.key,
    (comp as { roughnessMap?: { key?: string } }).roughnessMap?.key,
    (comp as { metallicMap?: { key?: string } }).metallicMap?.key,
    (comp as { envMap?: { key?: string } }).envMap?.key,
  ].join(',');
  let suffix = textureResolvedSuffix(comp, getTexture);
  if (comp.type === 'standardMaterial') return base + `${comp.metalness ?? 0}:${comp.roughness ?? 1}:${textureRefs}${suffix}`;
  if (comp.type === 'basicMaterial') return base + `${comp.wireframe ?? false}:${textureRefs}${suffix}`;
  if (comp.type === 'phongMaterial') return base + `${comp.specular ?? ''}:${comp.shininess ?? 30}:${textureRefs}${suffix}`;
  if (comp.type === 'lambertMaterial') return base + `${comp.emissive ?? ''}:${textureRefs}${suffix}`;
  return base + textureRefs + suffix;
}
