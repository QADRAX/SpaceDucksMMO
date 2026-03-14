/**
 * Integration tests for prefab instantiation from Lua scripts.
 *
 * Verifies that Scene.instantiate(prefabId, position?, rotation?) works when:
 * - Prefabs are registered via api.scene(id).addPrefab
 * - ResourceCoordinator preloads prefab resources on prefab-added
 * - First spawn has no delay (resources already in cache)
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId, createEntity, createPrefabId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from './testHelpers';

describe('Prefab instantiate integration', () => {
  it('spawn_on_interval instantiates prefab when prefab is registered', async () => {
    const { api } = await setupScriptingIntegrationTest({ engineSubsystems: [] });

    const sceneId = createSceneId('main');
    const spawnerId = createEntityId('spawner');
    addSceneWithEntity(api, sceneId, spawnerId);
    const scene = api.scene(sceneId);

    // Register bullet prefab before script runs
    const bulletTemplate = createEntity(createEntityId('bullet-tpl'), 'Bullet');
    scene.addPrefab({ prefabId: createPrefabId('bullet'), entity: bulletTemplate });

    addEntityWithScripts(api, sceneId, spawnerId, [
      {
        scriptId: 'builtin://spawn_on_interval.lua',
        properties: {
          prefab: 'bullet',
          interval: 0.1,
          maxCount: 3,
          offset: { x: 0, y: 0, z: 0 },
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 20, 0.05);

    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      // Spawner + 3 spawned bullets = 4 entities
      expect(listResult.value.length).toBeGreaterThanOrEqual(4);
      const bulletCount = listResult.value.filter((e) => e.displayName === 'Bullet').length;
      expect(bulletCount).toBe(3);
    }
  });

  it('instantiatePrefab creates entity with correct transform', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest({ engineSubsystems: [] });

    registerScript('scripts/instantiate-test', `
      return {
        init = function(self)
          self.Scene.instantiate('bullet', { x = 10, y = 20, z = 30 })
        end,
        update = function() end
      }
    `);

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    const scene = api.scene(sceneId);

    const bulletTemplate = createEntity(createEntityId('bullet-tpl'), 'Bullet');
    scene.addPrefab({ prefabId: createPrefabId('bullet'), entity: bulletTemplate });

    addEntityWithScripts(api, sceneId, entityId, [
      {
        scriptId: 'scripts/instantiate-test',
        properties: {},
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      const bullets = listResult.value.filter((e) => e.displayName === 'Bullet');
      expect(bullets.length).toBe(1);
      expect(bullets[0].transform.localPosition.x).toBe(10);
      expect(bullets[0].transform.localPosition.y).toBe(20);
      expect(bullets[0].transform.localPosition.z).toBe(30);
    }
  });
});
