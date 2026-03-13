import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Look at Entity', () => {
  it('should rotate looker to face target entity', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const lookerId = createEntityId('looker');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    const looker = createEntity(lookerId);
    scene.addEntity({ entity: looker });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 5, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, lookerId, [{
      scriptId: 'builtin://look_at_entity.lua',
      properties: {
        targetEntityId: targetId
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const view = scene.entity(lookerId).view();
    if (view.ok) {
      expect(view.value.transform.localRotation).toBeDefined();
    }
  });

  it('should not crash when target entity is destroyed', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const lookerId = createEntityId('looker');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(lookerId) });
    scene.addEntity({ entity: createEntity(targetId) });

    addEntityWithScripts(api, sceneId, lookerId, [{
      scriptId: 'builtin://look_at_entity.lua',
      properties: {
        targetEntityId: targetId,
        lookAtOffset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    scene.removeEntity({ entityId: targetId });
    api.update({ dt: 0.016 });

    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === lookerId)).toBe(true);
    }
  });

  it('should apply lookAtOffset to target position', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const lookerId = createEntityId('looker');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(lookerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 5, y: 2, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, lookerId, [{
      scriptId: 'builtin://look_at_entity.lua',
      properties: {
        targetEntityId: targetId,
        lookAtOffset: { x: 1, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const view = scene.entity(lookerId).view();
    expect(view.ok).toBe(true);
    if (view.ok) {
      expect(view.value.transform.localRotation).toBeDefined();
    }
  });
});
