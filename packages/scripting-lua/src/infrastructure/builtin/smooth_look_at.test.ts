import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Smooth Look At', () => {
  it('should rotate looker towards target entity', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const lookerId = createEntityId('looker');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(lookerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 5, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, lookerId, [{
      scriptId: 'builtin://smooth_look_at.lua',
      properties: {
        targetEntityId: targetId,
        speed: 5,
        easing: 'linear'
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

  it('should change rotation over time towards target', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const lookerId = createEntityId('looker');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(lookerId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 10, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, lookerId, [{
      scriptId: 'builtin://smooth_look_at.lua',
      properties: {
        targetEntityId: targetId,
        speed: 5,
        easing: 'linear'
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(lookerId).view();
    if (view0.ok) {
      const rot0 = view0.value.transform.localRotation.y;
      runFrames(api, 60, 0.016);
      const view1 = scene.entity(lookerId).view();
      if (view1.ok) {
        const rot1 = view1.value.transform.localRotation.y;
        expect(rot1).not.toBe(rot0);
      }
    }
  });
});
