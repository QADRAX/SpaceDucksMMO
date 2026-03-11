import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Billboard', () => {
  it('should run without error when camera reference is valid (lockY=false)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const boardId = createEntityId('board');
    const camId = createEntityId('camera');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(boardId) });
    scene.addEntity({ entity: createEntity(camId) });

    addEntityWithScripts(api, sceneId, boardId, [{
      scriptId: 'builtin://billboard.lua',
      properties: {
        cameraEntity: camId,
        lockY: false
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === boardId)).toBe(true);
    }
  });

  it('should run without error when lockY=true (cylindrical billboard)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const boardId = createEntityId('board');
    const camId = createEntityId('camera');

    const scene = createScene(api, sceneId);
    const board = createEntity(boardId);
    board.transform.localPosition = { x: 0, y: 0, z: 0 };
    scene.addEntity({ entity: board });
    const cam = createEntity(camId);
    cam.transform.localPosition = { x: 5, y: 0, z: 5 };
    scene.addEntity({ entity: cam });

    addEntityWithScripts(api, sceneId, boardId, [{
      scriptId: 'builtin://billboard.lua',
      properties: {
        cameraEntity: camId,
        lockY: true
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 5, 0.016);
    const view = scene.entity(boardId).view();
    expect(view.ok).toBe(true);
    if (view.ok) {
      expect(view.value.transform.localRotation).toBeDefined();
    }
  });

  it('should not crash when camera reference is missing (empty string)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const boardId = createEntityId('board');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(boardId) });

    addEntityWithScripts(api, sceneId, boardId, [{
      scriptId: 'builtin://billboard.lua',
      properties: {
        cameraEntity: '',
        lockY: false
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    api.update({ dt: 0.016 });
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === boardId)).toBe(true);
    }
  });

  it('should not crash when camera entity is destroyed (Scene.exists returns false)', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const boardId = createEntityId('board');
    const camId = createEntityId('camera');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(boardId) });
    scene.addEntity({ entity: createEntity(camId) });

    addEntityWithScripts(api, sceneId, boardId, [{
      scriptId: 'builtin://billboard.lua',
      properties: {
        cameraEntity: camId,
        lockY: false
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    scene.removeEntity({ entityId: camId });
    api.update({ dt: 0 });

    api.update({ dt: 0.016 });
    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === boardId)).toBe(true);
    }
  });
});
