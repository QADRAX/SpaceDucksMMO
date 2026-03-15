import {
  getComponent,
  isResourceRef,
  createResourceRef,
  createResourceKey,
  PLAIN_MATERIAL_COMPONENT_TYPES,
  getMaterialTextureRefs,
  type ResourceRef,
  type EntityState,
  type EngineState,
  type SceneState,
  type TrimeshColliderComponent,
  type CustomGeometryComponent,
  type SkyboxComponent,
  type ScriptComponent,
  type MaterialComponent,
} from '@duckengine/core-v2';

/** Script IDs that are resolved locally, not via the loader. */
function isBuiltInOrTestScript(scriptId: string): boolean {
  return scriptId.startsWith('builtin://') || scriptId.startsWith('test://');
}

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

  const customGeom = getComponent<CustomGeometryComponent>(entity, 'customGeometry');
  if (customGeom?.mesh && isResourceRef(customGeom.mesh)) {
    meshes.push(customGeom.mesh);
  }

  const trimeshCol = getComponent<TrimeshColliderComponent>(entity, 'trimeshCollider');
  if (trimeshCol?.mesh && isResourceRef(trimeshCol.mesh)) {
    meshes.push(trimeshCol.mesh);
  }

  for (const matType of PLAIN_MATERIAL_COMPONENT_TYPES) {
    const mat = getComponent<MaterialComponent>(entity, matType);
    if (!mat) continue;
    for (const ref of getMaterialTextureRefs(mat)) {
      if (isResourceRef(ref)) textures.push(ref);
    }
  }

  const skybox = getComponent<SkyboxComponent>(entity, 'skybox');
  if (skybox?.skybox && isResourceRef(skybox.skybox)) {
    skyboxes.push(skybox.skybox);
  }

  const scriptComp = getComponent<ScriptComponent>(entity, 'script');
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
