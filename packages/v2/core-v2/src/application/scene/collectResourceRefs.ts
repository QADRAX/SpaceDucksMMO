import { getComponent } from '../../domain/entities';
import { isResourceRef, createResourceRef, type ResourceRef } from '../../domain/resources';
import { createResourceKey } from '../../domain/ids';
import type { EntityState } from '../../domain/entities';
import type { SceneState } from '../../domain/scene';
import { PLAIN_MATERIAL_COMPONENT_TYPES } from '../../domain/components';

/** Script IDs that are resolved locally, not via ResourceLoaderPort. */
function isBuiltInOrTestScript(scriptId: string): boolean {
  return scriptId.startsWith('builtin://') || scriptId.startsWith('test://');
}

const TEXTURE_SLOT_KEYS = [
  'albedo',
  'normalMap',
  'aoMap',
  'roughnessMap',
  'metallicMap',
  'envMap',
] as const;

export interface CollectedRefs {
  meshes: ResourceRef<'mesh'>[];
  textures: ResourceRef<'texture'>[];
  skyboxes: ResourceRef<'skybox'>[];
  scripts: ResourceRef<'script'>[];
}

/** Collects resource refs from a single entity. */
export function collectRefsFromEntity(entity: EntityState): CollectedRefs {
  const meshes: ResourceRef<'mesh'>[] = [];
  const textures: ResourceRef<'texture'>[] = [];
  const skyboxes: ResourceRef<'skybox'>[] = [];
  const scripts: ResourceRef<'script'>[] = [];

  const customGeom = getComponent(entity, 'customGeometry') as { mesh?: ResourceRef<'mesh'> } | undefined;
  if (customGeom?.mesh && isResourceRef(customGeom.mesh)) {
    meshes.push(customGeom.mesh as ResourceRef<'mesh'>);
  }

  for (const matType of PLAIN_MATERIAL_COMPONENT_TYPES) {
    const mat = getComponent(entity, matType) as Record<string, unknown> | undefined;
    if (!mat) continue;
    for (const key of TEXTURE_SLOT_KEYS) {
      const val = mat[key];
      if (val && isResourceRef(val)) {
        textures.push(val as ResourceRef<'texture'>);
      }
    }
  }

  const skybox = getComponent(entity, 'skybox') as { skybox?: ResourceRef<'skybox'> } | undefined;
  if (skybox?.skybox && isResourceRef(skybox.skybox)) {
    skyboxes.push(skybox.skybox as ResourceRef<'skybox'>);
  }

  const scriptComp = getComponent(entity, 'script') as { scripts?: Array<{ scriptId: string }> } | undefined;
  if (scriptComp?.scripts) {
    for (const s of scriptComp.scripts) {
      if (s.scriptId && !isBuiltInOrTestScript(s.scriptId)) {
        scripts.push(createResourceRef(createResourceKey(s.scriptId), 'script'));
      }
    }
  }

  return { meshes, textures, skyboxes, scripts };
}

function collectFromEntityAndChildren(
  entity: EntityState,
  acc: CollectedRefs,
): void {
  const refs = collectRefsFromEntity(entity);
  acc.meshes.push(...refs.meshes);
  acc.textures.push(...refs.textures);
  acc.skyboxes.push(...refs.skyboxes);
  acc.scripts.push(...refs.scripts);
  for (const child of entity.children) {
    collectFromEntityAndChildren(child, acc);
  }
}

/** Collects resource refs from an entity and its entire subtree. */
export function collectRefsFromSubtree(entity: EntityState): CollectedRefs {
  const acc: CollectedRefs = { meshes: [], textures: [], skyboxes: [], scripts: [] };
  collectFromEntityAndChildren(entity, acc);
  return acc;
}

/** Collects resource refs from all entities in a scene. */
export function collectRefsFromScene(scene: SceneState): CollectedRefs {
  const acc: CollectedRefs = { meshes: [], textures: [], skyboxes: [], scripts: [] };
  for (const entity of scene.entities.values()) {
    const refs = collectRefsFromEntity(entity);
    acc.meshes.push(...refs.meshes);
    acc.textures.push(...refs.textures);
    acc.skyboxes.push(...refs.skyboxes);
    acc.scripts.push(...refs.scripts);
  }
  return acc;
}
