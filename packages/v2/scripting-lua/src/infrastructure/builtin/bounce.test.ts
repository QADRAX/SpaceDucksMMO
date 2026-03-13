import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Bounce', () => {
  it('should oscillate entity on Y axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('bouncer');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://bounce.lua',
      properties: {
        axis: 'y',
        amplitude: 0.5,
        frequency: 1
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const y0 = view0.value.transform.localPosition.y;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const y1 = view1.value.transform.localPosition.y;
        expect(y1).not.toBe(y0);
      }
    }
  });

  it('should oscillate entity on X axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('bouncer');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://bounce.lua',
      properties: {
        axis: 'x',
        amplitude: 0.3,
        frequency: 2
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const x0 = view0.value.transform.localPosition.x;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const x1 = view1.value.transform.localPosition.x;
        expect(x1).not.toBe(x0);
      }
    }
  });

  it('should oscillate entity on Z axis', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('bouncer');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://bounce.lua',
      properties: {
        axis: 'z',
        amplitude: 0.4,
        frequency: 1.5
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const z0 = view0.value.transform.localPosition.z;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const z1 = view1.value.transform.localPosition.z;
        expect(z1).not.toBe(z0);
      }
    }
  });

  it('should use Y axis when axis is unknown (default branch)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('bouncer');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://bounce.lua',
      properties: {
        axis: 'invalid',
        amplitude: 0.5,
        frequency: 1
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const y0 = view0.value.transform.localPosition.y;
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const y1 = view1.value.transform.localPosition.y;
        expect(y1).not.toBe(y0);
      }
    }
  });
});
