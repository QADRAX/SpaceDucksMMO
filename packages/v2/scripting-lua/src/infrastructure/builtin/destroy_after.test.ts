import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Destroy After', () => {
  it('should destroy entity after lifetime expires', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('mortal');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://destroy_after.lua',
      properties: {
        lifetime: 0.1
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const listBefore = scene.listEntities();
    expect(listBefore.ok).toBe(true);
    if (listBefore.ok) {
      expect(listBefore.value.some((e) => e.id === entityId)).toBe(true);
    }

    runFrames(api, 10, 0.02);

    const listAfter = scene.listEntities();
    expect(listAfter.ok).toBe(true);
    if (listAfter.ok) {
      expect(listAfter.value.some((e) => e.id === entityId)).toBe(false);
    }
  });

  it('should keep entity alive before lifetime expires', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('mortal');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://destroy_after.lua',
      properties: {
        lifetime: 1.0
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 10, 0.05);

    const listMid = scene.listEntities();
    expect(listMid.ok).toBe(true);
    if (listMid.ok) {
      expect(listMid.value.some((e) => e.id === entityId)).toBe(true);
    }
  });
});
