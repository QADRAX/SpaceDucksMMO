/**
 * Integration tests for scripting edge cases:
 * - Multiple scripts on same entity (isolated state per slot)
 * - Script that errors in update (slot disabled, engine continues)
 * - Entity removed (slots cleaned, no crash)
 * - Empty script (no hooks, no crash)
 * - Script reads missing property (no crash)
 *
 * Further edge cases to consider: disabled script (enabled: false from ECS),
 * script not found (resolver returns null), Lua error in init, enable/disable
 * toggle via component change, script removed from component (reconcile destroys slot).
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  addEntityToScene,
  waitForSlotInit,
  runFrames,
} from './testHelpers';
import { getScriptProperties } from './testUtils';

describe('Scripting edge cases integration', () => {
  it('multiple scripts on same entity have isolated state per slot', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    registerScript('script-a', `
      return {
        init = function(self) self.properties.label = 'A'; self.state.n = 0 end,
        update = function(self) self.state.n = self.state.n + 1; self.properties.count = self.state.n end
      }
    `);
    registerScript('script-b', `
      return {
        init = function(self) self.properties.label = 'B'; self.state.n = 0 end,
        update = function(self) self.state.n = self.state.n + 10; self.properties.count = self.state.n end
      }
    `);

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [
      { scriptId: 'script-a', enabled: true, properties: { label: '', count: 0 } },
      { scriptId: 'script-b', enabled: true, properties: { label: '', count: 0 } },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 3, 0.016);

    const snap = api.scene(sceneId).entity(entityId).component('script').snapshot();
    const props0 = getScriptProperties(snap, 0);
    const props1 = getScriptProperties(snap, 1);

    expect(props0?.label).toBe('A');
    expect(props0?.count).toBe(3);
    expect(props1?.label).toBe('B');
    expect(props1?.count).toBe(30);
  });

  it('script that errors in update gets disabled and engine continues', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    registerScript('error-on-second-update', `
      return {
        init = function(self) self.state.updates = 0; self.properties.done = false end,
        update = function(self)
          self.state.updates = self.state.updates + 1
          self.properties.updateCount = self.state.updates
          if self.state.updates >= 2 then error('intentional') end
        end
      }
    `);

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'error-on-second-update',
      enabled: true,
      properties: { updateCount: 0, done: false },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 5, 0.016);

    const props = getScriptProperties(
      api.scene(sceneId).entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.updateCount).toBe(1);
  });

  it('entity removed from scene cleans slots and next frame does not crash', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    registerScript('simple', `
      return { init = function(self) self.properties.inited = true end, update = function() end }
    `);

    const sceneId = createSceneId('main');
    const keepId = createEntityId('keep');
    const removeId = createEntityId('remove');
    addSceneWithEntity(api, sceneId, keepId);
    addEntityWithScripts(api, sceneId, keepId, [{
      scriptId: 'simple',
      enabled: true,
      properties: { inited: false },
    }]);
    addEntityToScene(api, sceneId, removeId);
    addEntityWithScripts(api, sceneId, removeId, [{
      scriptId: 'simple',
      enabled: true,
      properties: { inited: false },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    api.scene(sceneId).removeEntity({ entityId: removeId });
    expect(() => runFrames(api, 2, 0.016)).not.toThrow();

    const kept = getScriptProperties(
      api.scene(sceneId).entity(keepId).component('script').snapshot(),
      0,
    );
    expect(kept?.inited).toBe(true);
  });

  it('script with no hooks does not crash', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    registerScript('empty', 'return {}');

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'empty',
      enabled: true,
      properties: {},
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    expect(() => runFrames(api, 3, 0.016)).not.toThrow();

    const snap = api.scene(sceneId).entity(entityId).component('script').snapshot();
    expect(snap.ok).toBe(true);
  });

  it('script reading missing property does not crash', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    registerScript('read-missing', `
      return {
        init = function(self)
          local v = self.properties.missingKey
          self.properties.wasNil = (v == nil)
          self.properties.afterRead = 'ok'
        end
      }
    `);

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [{
      scriptId: 'read-missing',
      enabled: true,
      properties: {},
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    const props = getScriptProperties(
      api.scene(sceneId).entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.wasNil).toBe(true);
    expect(props?.afterRead).toBe('ok');
  });
});
