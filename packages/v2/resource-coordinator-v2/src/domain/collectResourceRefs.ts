import { getComponent } from '@duckengine/core-v2';
import {
  isResourceRef,
  createResourceRef,
  type ResourceRef,
} from '@duckengine/core-v2';
import { createResourceKey } from '@duckengine/core-v2';
import type { EntityState, TrimeshColliderComponent } from '@duckengine/core-v2';
import type { EngineState, SceneState } from '@duckengine/core-v2';
import { PLAIN_MATERIAL_COMPONENT_TYPES } from '@duckengine/core-v2';

/** Script IDs that are resolved locally, not via the loader. */
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

  const trimeshCol = getComponent(entity, 'trimeshCollider') as TrimeshColliderComponent | undefined;
  if (trimeshCol?.mesh && isResourceRef(trimeshCol.mesh)) {
    meshes.push(trimeshCol.mesh);
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

/** Collects resource refs from all prefabs in a scene. */
export function collectRefsFromPrefabs(scene: SceneState): CollectedRefs {
  const acc: CollectedRefs = { meshes: [], textures: [], skyboxes: [], scripts: [] };
  for (const prefabEntity of scene.prefabs.values()) {
    const refs = collectRefsFromSubtree(prefabEntity);
    acc.meshes.push(...refs.meshes);
    acc.textures.push(...refs.textures);
    acc.skyboxes.push(...refs.skyboxes);
    acc.scripts.push(...refs.scripts);
  }
  return acc;
}

/** Collects resource refs from all entities and prefabs in a scene. */
export function collectRefsFromScene(scene: SceneState): CollectedRefs {
  const acc: CollectedRefs = { meshes: [], textures: [], skyboxes: [], scripts: [] };
  for (const entity of scene.entities.values()) {
    const refs = collectRefsFromEntity(entity);
    acc.meshes.push(...refs.meshes);
    acc.textures.push(...refs.textures);
    acc.skyboxes.push(...refs.skyboxes);
    acc.scripts.push(...refs.scripts);
  }
  const prefabRefs = collectRefsFromPrefabs(scene);
  acc.meshes.push(...prefabRefs.meshes);
  acc.textures.push(...prefabRefs.textures);
  acc.skyboxes.push(...prefabRefs.skyboxes);
  acc.scripts.push(...prefabRefs.scripts);
  return acc;
}

/** Collects resource refs from all scenes in the engine. */
export function collectRefsFromAllScenes(engine: EngineState): CollectedRefs {
  const acc: CollectedRefs = { meshes: [], textures: [], skyboxes: [], scripts: [] };
  for (const scene of engine.scenes.values()) {
    const refs = collectRefsFromScene(scene);
    acc.meshes.push(...refs.meshes);
    acc.textures.push(...refs.textures);
    acc.skyboxes.push(...refs.skyboxes);
    acc.scripts.push(...refs.scripts);
  }
  return acc;
}
