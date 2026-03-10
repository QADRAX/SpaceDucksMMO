/**
 * Scenario: Add new entity at runtime with Lua script resolved via ResourceLoader.
 *
 * Verifies that:
 * - Entity can be added to an existing scene after initial setup
 * - Script component with runtime-resolved scriptId gets a slot
 * - Script init runs and properties flush to ECS
 * - Runtime scripts can drive builtin scripts via Script.setProperty
 * - Entity removal cleans up slots
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from '../setup';
import {
  addSceneWithEntity,
  addEntityToScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testHelpers';
import { getScriptProperties } from '../testUtils';

describe('Scenario: Dynamic entity with runtime-resolved script', () => {
  it('adds new entity to scene and runs Lua script resolved at runtime', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneId = createSceneId('main');
    const firstEntityId = createEntityId('e1');
    const secondEntityId = createEntityId('e2');

    // 1. Register a script that will be resolved at runtime (via ResourceLoader)
    registerScript('runtime-spawned-script', `
      return {
        init = function(self)
          self.properties.spawnedAt = 'runtime'
          self.properties.entityId = tostring(self.entity.id)
        end
      }
    `);

    // 2. Create scene with first entity
    addSceneWithEntity(api, sceneId, firstEntityId);
    addEntityWithScripts(api, sceneId, firstEntityId, [{
      scriptId: 'runtime-spawned-script',
      enabled: true,
      properties: { spawnedAt: '', entityId: '' },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    // 3. Add second entity at runtime (simulates dynamic spawn)
    addEntityToScene(api, sceneId, secondEntityId);
    addEntityWithScripts(api, sceneId, secondEntityId, [{
      scriptId: 'runtime-spawned-script',
      enabled: true,
      properties: { spawnedAt: '', entityId: '' },
    }]);

    // 4. Trigger reconcile and wait for async slot init
    api.update({ dt: 0 });
    await waitForSlotInit(250);
    runFrames(api, 1);

    // 5. Verify both entities have script running
    const scene = api.scene(sceneId);

    const props1 = getScriptProperties(
      scene.entity(firstEntityId).component('script').snapshot(),
      0,
    );
    expect(props1?.spawnedAt).toBe('runtime');
    expect(props1?.entityId).toBe(firstEntityId);

    const props2 = getScriptProperties(
      scene.entity(secondEntityId).component('script').snapshot(),
      0,
    );
    expect(props2?.spawnedAt).toBe('runtime');
    expect(props2?.entityId).toBe(secondEntityId);
  });

  it('adds entity with new script registered after scene setup', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneId = createSceneId('main');
    const entityId = createEntityId('spawned');

    // 1. Create empty scene, run a frame
    addSceneWithEntity(api, sceneId, entityId);
    api.update({ dt: 0 });

    // 2. Register script and add component AFTER scene exists
    registerScript('late-registered-script', `
      return {
        init = function(self)
          self.properties.initialized = true
        end
      }
    `);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'late-registered-script',
      enabled: true,
      properties: { initialized: false },
    }]);

    // 3. Reconcile, init, flush
    api.update({ dt: 0 });
    await waitForSlotInit(250);
    runFrames(api, 1);

    const props = getScriptProperties(
      api.scene(sceneId).entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.initialized).toBe(true);
  });

  it('complex: spawn movers at different times, runtime controller drives builtin, remove entity', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneId = createSceneId('main');
    const mover1Id = createEntityId('mover1');
    const mover2Id = createEntityId('mover2');
    const mover3Id = createEntityId('mover3');

    // Runtime controller: drives move_to_point via entity.components.script.setProperty each update
    registerScript('runtime-mover-controller', `
      return {
        update = function(self, dt)
          local t = self.state.elapsed or 0
          self.state.elapsed = t + dt
          local targetX = 5 + math.floor(t) * 5
          if targetX <= 15 then
            self.entity.components.script.setProperty('builtin://move_to_point.lua', 'targetPoint',
              math.vec3.new(targetX, 0, 0))
          end
        end
      }
    `);

    // 1. Spawn mover1 with builtin + runtime controller
    addSceneWithEntity(api, sceneId, mover1Id);
    addEntityWithScripts(api, sceneId, mover1Id, [
      { scriptId: 'runtime-mover-controller', enabled: true, properties: {} },
      {
        scriptId: 'builtin://move_to_point.lua',
        enabled: true,
        properties: { targetPoint: { x: 0, y: 0, z: 0 }, duration: 0.5, easing: 'linear' },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 30, 0.016); // ~0.5s

    const scene = api.scene(sceneId);
    const view1a = scene.entity(mover1Id).view();
    expect(view1a.ok).toBe(true);
    expect((view1a as { value: { transform: { localPosition: { x: number } } } }).value.transform.localPosition.x).toBeGreaterThan(0);

    // 2. Spawn mover2 at runtime
    addEntityToScene(api, sceneId, mover2Id);
    addEntityWithScripts(api, sceneId, mover2Id, [
      { scriptId: 'runtime-mover-controller', enabled: true, properties: {} },
      {
        scriptId: 'builtin://move_to_point.lua',
        enabled: true,
        properties: { targetPoint: { x: 0, y: 0, z: 0 }, duration: 0.5, easing: 'linear' },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(250);
    runFrames(api, 20, 0.016);

    // 3. Spawn mover3 at runtime
    addEntityToScene(api, sceneId, mover3Id);
    addEntityWithScripts(api, sceneId, mover3Id, [
      { scriptId: 'runtime-mover-controller', enabled: true, properties: {} },
      {
        scriptId: 'builtin://move_to_point.lua',
        enabled: true,
        properties: { targetPoint: { x: 0, y: 0, z: 0 }, duration: 0.5, easing: 'linear' },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(250);
    runFrames(api, 15, 0.016);

    // 4. Remove mover2 — slots should be destroyed
    const removeResult = scene.removeEntity({ entityId: mover2Id });
    expect(removeResult.ok).toBe(true);

    api.update({ dt: 0 });
    await waitForSlotInit(50);
    runFrames(api, 10, 0.016);

    // 5. Verify mover1 and mover3 still work; mover2 is gone
    const view1 = scene.entity(mover1Id).view();
    const view3 = scene.entity(mover3Id).view();
    const listResult = scene.listEntities();

    expect(view1.ok).toBe(true);
    expect(view3.ok).toBe(true);
    expect(listResult.ok).toBe(true);
    const entityIds = (listResult as { value: Array<{ id: string }> }).value.map((e) => e.id);
    expect(entityIds).toContain(mover1Id);
    expect(entityIds).toContain(mover3Id);
    expect(entityIds).not.toContain(mover2Id);

    // Both remaining movers should have moved (x > 0)
    const x1 = (view1 as { value: { transform: { localPosition: { x: number } } } }).value.transform.localPosition.x;
    const x3 = (view3 as { value: { transform: { localPosition: { x: number } } } }).value.transform.localPosition.x;
    expect(x1).toBeGreaterThan(0);
    expect(x3).toBeGreaterThan(0);
  });
});
