/**
 * Integration tests for the resource coordinator subsystem.
 * Tests only resource coordination + core-v2; ResourceLoader is mocked.
 * No scripting, physics, rendering, or other subsystems.
 */
/** @jest-environment node */

import { describe, it, expect } from '@jest/globals';
import {
  createSceneId,
  createEntityId,
  createPrefabId,
  createEntity,
  createComponent,
  addComponent,
  createResourceRef,
  createResourceKey,
  ResourceCachePortDef,
} from '@duckengine/core-v2';
import type { ResourceCachePort } from '@duckengine/core-v2';
import {
  setupResourceCoordinatorIntegrationTest,
  addSceneWithEntity,
  addCustomGeometry,
  addScriptComponent,
  waitForLoads,
} from './setup';

function getCache(engine: { subsystemRuntime: { ports: Map<string, unknown> } }): ResourceCachePort | undefined {
  return engine.subsystemRuntime.ports.get(ResourceCachePortDef.id) as ResourceCachePort | undefined;
}

describe('Resource coordinator integration', () => {
  it('entity added with customGeometry triggers mesh load into cache', async () => {
    const { api, engine } = setupResourceCoordinatorIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');

    addSceneWithEntity(api, sceneId, entityId);
    addCustomGeometry(api, sceneId, entityId, 'test-mesh');

    await waitForLoads(80);

    const cache = getCache(engine);
    expect(cache).toBeDefined();
    const meshRef = createResourceRef(createResourceKey('test-mesh'), 'mesh');
    const data = cache!.getMeshData(meshRef);
    expect(data).not.toBeNull();
    expect(data).toHaveProperty('positions');
  });

  it('entity added with script component triggers script load into cache', async () => {
    const { api, engine } = setupResourceCoordinatorIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');

    addSceneWithEntity(api, sceneId, entityId);
    addScriptComponent(api, sceneId, entityId, 'game/player-controller');

    await waitForLoads(80);

    const cache = getCache(engine);
    expect(cache).toBeDefined();
    const scriptRef = createResourceRef(createResourceKey('game/player-controller'), 'script');
    const source = cache!.getScriptSource(scriptRef);
    expect(source).not.toBeNull();
    expect(source).toBe('return {}');
  });

  it('component changed adds new refs and triggers load', async () => {
    const { api, engine } = setupResourceCoordinatorIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');

    addSceneWithEntity(api, sceneId, entityId);
    addCustomGeometry(api, sceneId, entityId, 'first-mesh');

    await waitForLoads(50);

    const cache = getCache(engine);
    expect(cache!.getMeshData(createResourceRef(createResourceKey('first-mesh'), 'mesh'))).not.toBeNull();

    api.scene(sceneId).entity(entityId).removeComponent({ componentType: 'customGeometry' });
    addCustomGeometry(api, sceneId, entityId, 'second-mesh');

    await waitForLoads(50);

    expect(cache!.getMeshData(createResourceRef(createResourceKey('second-mesh'), 'mesh'))).not.toBeNull();
  });

  it('prefab added triggers load of prefab subtree refs', async () => {
    const { api, engine } = setupResourceCoordinatorIntegrationTest();
    const sceneId = createSceneId('main');
    const prefabId = createPrefabId('player-prefab');

    api.addScene({ sceneId });
    const prefabEntity = createEntity(createEntityId('prefab-root'));
    addComponent(prefabEntity, createComponent('script', {
      scripts: [{ scriptId: 'prefab/player-script', enabled: true, properties: {} }],
    }));
    api.scene(sceneId).addPrefab({ prefabId, entity: prefabEntity });

    await waitForLoads(80);

    const cache = getCache(engine);
    expect(cache).toBeDefined();
    const scriptRef = createResourceRef(createResourceKey('prefab/player-script'), 'script');
    const source = cache!.getScriptSource(scriptRef);
    expect(source).not.toBeNull();
  });

  it('builtin and test scripts are not loaded', async () => {
    const { api, engine } = setupResourceCoordinatorIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');

    addSceneWithEntity(api, sceneId, entityId);
    addScriptComponent(api, sceneId, entityId, [
      { scriptId: 'builtin://move', enabled: true, properties: {} },
      { scriptId: 'test://mock', enabled: true, properties: {} },
    ]);

    await waitForLoads(30);

    const cache = getCache(engine);
    expect(cache!.getScriptSource(createResourceRef(createResourceKey('builtin://move'), 'script'))).toBeNull();
    expect(cache!.getScriptSource(createResourceRef(createResourceKey('test://mock'), 'script'))).toBeNull();
  });
});
