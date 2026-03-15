import { describe, it, expect } from '@jest/globals';
import {
  createEntity,
  createComponent,
  addComponent,
  addChild,
  createEntityId,
  createSceneId,
  createPrefabId,
  createResourceRef,
  createResourceKey,
} from '@duckengine/core-v2';
import {
  collectRefsFromEntity,
  collectRefsFromSubtree,
  collectRefsFromScene,
  collectRefsFromPrefabs,
  collectRefsFromAllScenes,
} from './collectResourceRefs';

describe('collectResourceRefs', () => {
  it('collects mesh ref from customGeometry', () => {
    const entity = createEntity(createEntityId('e1'));
    const meshRef = createResourceRef(createResourceKey('test-mesh'), 'mesh');
    addComponent(entity, createComponent('customGeometry', { mesh: meshRef }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.meshes).toHaveLength(1);
    expect(refs.meshes[0].key).toBe('test-mesh');
    expect(refs.meshes[0].kind).toBe('mesh');
    expect(refs.textures).toHaveLength(0);
    expect(refs.skyboxes).toHaveLength(0);
    expect(refs.scripts).toHaveLength(0);
  });

  it('collects mesh ref from trimeshCollider', () => {
    const entity = createEntity(createEntityId('e1'));
    addComponent(entity, createComponent('rigidBody', {}));
    const meshRef = createResourceRef(createResourceKey('collider-mesh'), 'mesh');
    addComponent(entity, createComponent('trimeshCollider', { mesh: meshRef }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.meshes).toHaveLength(1);
    expect(refs.meshes[0].key).toBe('collider-mesh');
  });

  it('collects texture refs from standardMaterial', () => {
    const entity = createEntity(createEntityId('e1'));
    addComponent(entity, createComponent('boxGeometry', { width: 1, height: 1, depth: 1 }));
    const albedoRef = createResourceRef(createResourceKey('albedo-tex'), 'texture');
    addComponent(entity, createComponent('standardMaterial', { albedo: albedoRef }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.textures).toHaveLength(1);
    expect(refs.textures[0].key).toBe('albedo-tex');
  });

  it('collects skybox ref from skybox component', () => {
    const entity = createEntity(createEntityId('e1'));
    const skyboxRef = createResourceRef(createResourceKey('space-sky'), 'skybox');
    addComponent(entity, createComponent('skybox', { skybox: skyboxRef }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.skyboxes).toHaveLength(1);
    expect(refs.skyboxes[0].key).toBe('space-sky');
  });

  it('collects script refs from script component, skips builtin and test', () => {
    const entity = createEntity(createEntityId('e1'));
    addComponent(entity, createComponent('script', {
      scripts: [
        { scriptId: 'builtin://move', enabled: true, properties: {} },
        { scriptId: 'test://mock', enabled: true, properties: {} },
        { scriptId: 'my-game/player', enabled: true, properties: {} },
      ],
    }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.scripts).toHaveLength(1);
    expect(refs.scripts[0].key).toBe('my-game/player');
    expect(refs.scripts[0].kind).toBe('script');
  });

  it('returns empty refs for entity with no resource components', () => {
    const entity = createEntity(createEntityId('e1'));
    addComponent(entity, createComponent('name', { value: 'Foo' }));
    addComponent(entity, createComponent('boxGeometry', { width: 1, height: 1, depth: 1 }));

    const refs = collectRefsFromEntity(entity);
    expect(refs.meshes).toHaveLength(0);
    expect(refs.textures).toHaveLength(0);
    expect(refs.skyboxes).toHaveLength(0);
    expect(refs.scripts).toHaveLength(0);
  });

  it('collectRefsFromSubtree aggregates refs from entity and children', () => {
    const parent = createEntity(createEntityId('p1'));
    const child = createEntity(createEntityId('c1'));
    addChild(parent, child);

    const meshRef = createResourceRef(createResourceKey('parent-mesh'), 'mesh');
    addComponent(parent, createComponent('customGeometry', { mesh: meshRef }));

    addComponent(child, createComponent('script', {
      scripts: [{ scriptId: 'child-script', enabled: true, properties: {} }],
    }));

    const refs = collectRefsFromSubtree(parent);
    expect(refs.meshes).toHaveLength(1);
    expect(refs.meshes[0].key).toBe('parent-mesh');
    expect(refs.scripts).toHaveLength(1);
    expect(refs.scripts[0].key).toBe('child-script');
  });

  it('collectRefsFromScene aggregates refs from all entities and prefabs', () => {
    const sceneId = createSceneId('main');
    const scene = {
      id: sceneId,
      entities: new Map(),
      prefabs: new Map(),
      rootEntityIds: [] as string[],
      activeCameraId: null as string | null,
      debugFlags: new Map(),
      changeListeners: new Set(),
      entityCleanups: new Map(),
      subsystems: [],
      uiSlots: new Map(),
      paused: false,
      scenePorts: new Map(),
      scenePortDefinitions: new Map(),
    };

    const e1 = createEntity(createEntityId('e1'));
    addComponent(e1, createComponent('customGeometry', {
      mesh: createResourceRef(createResourceKey('entity-mesh'), 'mesh'),
    }));
    scene.entities.set(e1.id, e1);

    const prefabEntity = createEntity(createEntityId('prefab-root'));
    addComponent(prefabEntity, createComponent('script', {
      scripts: [{ scriptId: 'prefab/script', enabled: true, properties: {} }],
    }));
    scene.prefabs.set(createPrefabId('prefab-1'), prefabEntity);

    const refs = collectRefsFromScene(scene as any);
    expect(refs.meshes).toHaveLength(1);
    expect(refs.meshes[0].key).toBe('entity-mesh');
    expect(refs.scripts).toHaveLength(1);
    expect(refs.scripts[0].key).toBe('prefab/script');
  });

  it('collectRefsFromPrefabs collects only from prefab entities', () => {
    const sceneId = createSceneId('main');
    const prefabEntity = createEntity(createEntityId('prefab-e1'));
    addComponent(prefabEntity, createComponent('skybox', {
      skybox: createResourceRef(createResourceKey('prefab-sky'), 'skybox'),
    }));

    const scene = {
      id: sceneId,
      entities: new Map(),
      prefabs: new Map([[createPrefabId('p1'), prefabEntity]]),
      rootEntityIds: [],
      activeCameraId: null,
      debugFlags: new Map(),
      changeListeners: new Set(),
      entityCleanups: new Map(),
      subsystems: [],
      uiSlots: new Map(),
      paused: false,
      scenePorts: new Map(),
      scenePortDefinitions: new Map(),
    };

    const refs = collectRefsFromPrefabs(scene as any);
    expect(refs.skyboxes).toHaveLength(1);
    expect(refs.skyboxes[0].key).toBe('prefab-sky');
  });

  it('collectRefsFromAllScenes aggregates refs from all scenes', () => {
    const engine = {
      scenes: new Map(),
    };

    const sceneA = {
      id: createSceneId('a'),
      entities: new Map(),
      prefabs: new Map(),
      rootEntityIds: [],
      activeCameraId: null,
      debugFlags: new Map(),
      changeListeners: new Set(),
      entityCleanups: new Map(),
      subsystems: [],
      uiSlots: new Map(),
      paused: false,
      scenePorts: new Map(),
      scenePortDefinitions: new Map(),
    };
    const eA = createEntity(createEntityId('ea'));
    addComponent(eA, createComponent('customGeometry', {
      mesh: createResourceRef(createResourceKey('scene-a-mesh'), 'mesh'),
    }));
    sceneA.entities.set(eA.id, eA);
    engine.scenes.set(sceneA.id, sceneA);

    const sceneB = {
      id: createSceneId('b'),
      entities: new Map(),
      prefabs: new Map(),
      rootEntityIds: [],
      activeCameraId: null,
      debugFlags: new Map(),
      changeListeners: new Set(),
      entityCleanups: new Map(),
      subsystems: [],
      uiSlots: new Map(),
      paused: false,
      scenePorts: new Map(),
      scenePortDefinitions: new Map(),
    };
    const eB = createEntity(createEntityId('eb'));
    addComponent(eB, createComponent('customGeometry', {
      mesh: createResourceRef(createResourceKey('scene-b-mesh'), 'mesh'),
    }));
    sceneB.entities.set(eB.id, eB);
    engine.scenes.set(sceneB.id, sceneB);

    const refs = collectRefsFromAllScenes(engine as any);
    expect(refs.meshes).toHaveLength(2);
    expect(refs.meshes.map((r) => r.key).sort()).toEqual(['scene-a-mesh', 'scene-b-mesh']);
  });
});
