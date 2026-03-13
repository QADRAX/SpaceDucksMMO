import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Orbit Camera', () => {
  it('should orbit around target entity', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const orbiterId = createEntityId('orbiter');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(orbiterId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 0, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, orbiterId, [{
      scriptId: 'builtin://orbit_camera.lua',
      properties: {
        targetEntityId: targetId,
        speed: 1,
        orbitPlane: 'xz',
        altitudeFromSurface: 5
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    const view0 = scene.entity(orbiterId).view();
    if (view0.ok) {
      runFrames(api, 30, 0.016);
      const view1 = scene.entity(orbiterId).view();
      if (view1.ok) {
        const pos = view1.value.transform.localPosition;
        const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        expect(dist).toBeCloseTo(6, 0);
      }
    }
  });

  it('should orbit on xy plane', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const orbiterId = createEntityId('orbiter');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(orbiterId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 0, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, orbiterId, [{
      scriptId: 'builtin://orbit_camera.lua',
      properties: {
        targetEntityId: targetId,
        speed: 1,
        orbitPlane: 'xy',
        altitudeFromSurface: 5
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 30, 0.016);
    const view = scene.entity(orbiterId).view();
    if (view.ok) {
      const pos = view.value.transform.localPosition;
      const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      expect(dist).toBeCloseTo(6, 0);
    }
  });

  it('should orbit on yz plane', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const orbiterId = createEntityId('orbiter');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(orbiterId) });
    const target = createEntity(targetId);
    target.transform.localPosition = { x: 0, y: 0, z: 0 };
    scene.addEntity({ entity: target });

    addEntityWithScripts(api, sceneId, orbiterId, [{
      scriptId: 'builtin://orbit_camera.lua',
      properties: {
        targetEntityId: targetId,
        speed: 1,
        orbitPlane: 'yz',
        altitudeFromSurface: 5
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    runFrames(api, 30, 0.016);
    const view = scene.entity(orbiterId).view();
    if (view.ok) {
      const pos = view.value.transform.localPosition;
      const dist = Math.sqrt(pos.y * pos.y + pos.z * pos.z);
      expect(dist).toBeCloseTo(6, 0);
    }
  });

  it('should not crash when target entity is destroyed', async () => {
    const { api } = await setupScriptingIntegrationTest();
    const sceneId = createSceneId('main');
    const orbiterId = createEntityId('orbiter');
    const targetId = createEntityId('target');

    const scene = createScene(api, sceneId);
    scene.addEntity({ entity: createEntity(orbiterId) });
    scene.addEntity({ entity: createEntity(targetId) });

    addEntityWithScripts(api, sceneId, orbiterId, [{
      scriptId: 'builtin://orbit_camera.lua',
      properties: {
        targetEntityId: targetId,
        speed: 1,
        orbitPlane: 'xz',
        altitudeFromSurface: 0
      }
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit();

    scene.removeEntity({ entityId: targetId });
    api.update({ dt: 0.016 });

    const listResult = scene.listEntities();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.some((e) => e.id === orbiterId)).toBe(true);
    }
  });
});
