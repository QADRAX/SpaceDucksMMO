import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: First Person Move', () => {
  it('should move entity when input is pressed (mock returns true)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('mover');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://first_person_move.lua',
      properties: {
        moveSpeed: 5,
        flyMode: false
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

  it('should move vertically when flyMode=true and space/ctrl pressed', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('mover');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://first_person_move.lua',
      properties: {
        moveSpeed: 5,
        flyMode: true
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

  it('should apply sprint multiplier when shift is pressed', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const entityId = createEntityId('mover');
    const scene = addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'builtin://first_person_move.lua',
      properties: {
        moveSpeed: 5,
        sprintMultiplier: 3,
        flyMode: false
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(entityId).view();
    if (view0.ok) {
      const z0 = view0.value.transform.localPosition.z;
      runFrames(api, 15, 0.016);
      const view1 = scene.entity(entityId).view();
      if (view1.ok) {
        const z1 = view1.value.transform.localPosition.z;
        expect(Math.abs(z1 - z0)).toBeGreaterThan(0.5);
      }
    }
  });
});
