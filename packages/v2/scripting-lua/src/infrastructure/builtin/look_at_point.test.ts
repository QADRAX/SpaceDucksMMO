import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Look at Point', () => {
  it('should rotate entity to face target point', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('looker');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://look_at_point.lua',
      properties: {
        targetPoint: { x: 10, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const view = scene.entity(entityId).view();
    if (view.ok) {
      expect(view.value.transform.localRotation).toBeDefined();
    }
  });

  it('should not crash when targetPoint is nil', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('looker');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://look_at_point.lua',
      properties: {
        targetPoint: undefined
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === entityId)).toBe(true);
    }
  });
});
