import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Smooth Follow', () => {
  it('should move follower towards target over time', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const followerId = createEntityId('follower');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(followerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 5, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, followerId, [{
      scriptId: 'builtin://smooth_follow.lua',
      properties: {
        targetEntityId: targetId,
        duration: 1,
        easing: 'linear',
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(followerId).view();
    if (view0.ok) {
      const x0 = view0.value.transform.localPosition.x;
      runFrames(api, 30, 0.033);
      const view1 = scene.entity(followerId).view();
      if (view1.ok) {
        const x1 = view1.value.transform.localPosition.x;
        expect(x1).toBeGreaterThan(x0);
      }
    }
  });

  it('should not crash when target entity is destroyed', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const followerId = createEntityId('follower');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(followerId) });
    scene.addEntity({ entity: createEntity(targetId) });

    addEntityWithScripts(api, sceneId, followerId, [{
      scriptId: 'builtin://smooth_follow.lua',
      properties: {
        targetEntityId: targetId,
        duration: 1,
        easing: 'linear',
        offset: { x: 0, y: 0, z: 0 }
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    scene.removeEntity({ entityId: targetId });
    api.update({ dt: 0.016 });

    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === followerId)).toBe(true);
    }
  });
});
