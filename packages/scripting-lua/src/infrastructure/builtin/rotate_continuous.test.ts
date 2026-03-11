import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Rotate Continuous', () => {
  it('should rotate entity over time on Y axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spinner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://rotate_continuous.lua',
      properties: {
        speedX: 0,
        speedY: 90,
        speedZ: 0
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const rot0 = view0.value.transform.localRotation.y;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const rot1 = view1.value.transform.localRotation.y;
        expect(rot1).not.toBe(rot0);
      }
    }
  });

  it('should rotate on X axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spinner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://rotate_continuous.lua',
      properties: {
        speedX: 90,
        speedY: 0,
        speedZ: 0
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const rot0 = view0.value.transform.localRotation.x;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const rot1 = view1.value.transform.localRotation.x;
        expect(rot1).not.toBe(rot0);
      }
    }
  });

  it('should rotate on Z axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spinner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://rotate_continuous.lua',
      properties: {
        speedX: 0,
        speedY: 0,
        speedZ: 45
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const rot0 = view0.value.transform.localRotation.z;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const rot1 = view1.value.transform.localRotation.z;
        expect(rot1).not.toBe(rot0);
      }
    }
  });

  it('should rotate on all axes simultaneously', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('spinner');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://rotate_continuous.lua',
      properties: {
        speedX: 30,
        speedY: 45,
        speedZ: 60
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const rot0 = { ...view0.value.transform.localRotation };
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const rot1 = view1.value.transform.localRotation;
        expect(rot1.x).not.toBe(rot0.x);
        expect(rot1.y).not.toBe(rot0.y);
        expect(rot1.z).not.toBe(rot0.z);
      }
    }
  });
});
