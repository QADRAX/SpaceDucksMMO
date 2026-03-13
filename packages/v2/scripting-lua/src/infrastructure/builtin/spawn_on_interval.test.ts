import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Spawn On Interval', () => {
  it('should run without error (instantiate may return null without prefab wiring)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spawner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://spawn_on_interval.lua',
      properties: {
        prefab: 'test-prefab',
        interval: 1,
        maxCount: 3,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 10, 0.2);
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === entityId)).toBe(true);
    }
  });

  it('should stop spawning when maxCount is reached', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spawner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://spawn_on_interval.lua',
      properties: {
        prefab: 'test-prefab',
        interval: 0.1,
        maxCount: 2,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const list0 = scene.listEntities();
    const initialCount = list0.ok ? list0.value.length : 0;
    runFrames(api, 50, 0.05);
    const list1 = scene.listEntities();
    const finalCount = list1.ok ? list1.value.length : 0;
    expect(finalCount - initialCount).toBeLessThanOrEqual(3);
  });

  it('should not crash when prefab is empty string', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spawner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://spawn_on_interval.lua',
      properties: {
        prefab: '',
        interval: 0.1,
        maxCount: 5,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 20, 0.1);
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === entityId)).toBe(true);
    }
  });
});
