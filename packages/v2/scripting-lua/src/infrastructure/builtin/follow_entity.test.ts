import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Follow Entity', () => {
  it('should move follower towards target over time', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const followerId = createEntityId('follower');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(followerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 10, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, followerId, [{
      scriptId: 'builtin://follow_entity.lua',
      properties: {
        targetEntityId: targetId,
        delay: 0,
        speed: 5,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(followerId).view();
    if (view0.ok) {
      const x0 = view0.value.transform.localPosition.x;
      runFrames(api, 60, 0.016);
      const view1 = scene.entity(followerId).view();
      if (view1.ok) {
        const x1 = view1.value.transform.localPosition.x;
        expect(x1).toBeGreaterThan(x0);
      }
    }
  });

  it('should not crash when target entity is destroyed mid-follow', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const followerId = createEntityId('follower');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(followerId) });
    scene.addEntity({ entity: createEntity(targetId) });

    addEntityWithScripts(api, sceneId, followerId, [{
      scriptId: 'builtin://follow_entity.lua',
      properties: {
        targetEntityId: targetId,
        delay: 0,
        speed: 5,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    scene.removeEntity({ entityId: targetId });
    api.update({ dt: 0 });

    runFrames(api, 5, 0.016);
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === followerId)).toBe(true);
    }
  });

  it('should use delay history when delay > 0', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const followerId = createEntityId('follower');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(followerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 10, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, followerId, [{
      scriptId: 'builtin://follow_entity.lua',
      properties: {
        targetEntityId: targetId,
        delay: 0.5,
        speed: 10,
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 60, 0.016);
    const view = scene.entity(followerId).view();
    if (view.ok) {
      expect(view.value.transform.localPosition.x).toBeGreaterThan(0);
    }
  });
});
