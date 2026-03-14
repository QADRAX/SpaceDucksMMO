/**
 * Integration tests: engine with multiple scenes; scripts run per scene in isolation.
 * Each scene has its own scripting session/slots; scripts in scene A cannot see scene B state.
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from './testHelpers';
import { getScriptProperties } from './testUtils';

describe('Scripting multiple scenes integration', () => {
  it('two scenes each have independent scripting sessions and slots', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const entityA = createEntityId('entityA');
    const entityB = createEntityId('entityB');

    registerScript('multi-scene-script', `
      return {
        init = function(self)
          self.properties.entityId = tostring(self.entity.id)
          self.properties.label = self.properties.label or 'default'
        end,
        update = function(self, dt)
          self.state.tickCount = (self.state.tickCount or 0) + 1
        end
      }
    `);

    addSceneWithEntity(api, sceneA, entityA);
    addEntityWithScripts(api, sceneA, entityA, [{
      scriptId: 'multi-scene-script',
      enabled: true,
      properties: { entityId: '', label: 'A' },
    }]);

    addSceneWithEntity(api, sceneB, entityB);
    addEntityWithScripts(api, sceneB, entityB, [{
      scriptId: 'multi-scene-script',
      enabled: true,
      properties: { entityId: '', label: 'B' },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 5, 0.016);

    const sceneAApi = api.scene(sceneA);
    const sceneBApi = api.scene(sceneB);

    const propsA = getScriptProperties(
      sceneAApi.entity(entityA).component('script').snapshot(),
      0,
    );
    const propsB = getScriptProperties(
      sceneBApi.entity(entityB).component('script').snapshot(),
      0,
    );

    expect(propsA?.entityId).toBe(entityA);
    expect(propsA?.label).toBe('A');
    expect(propsB?.entityId).toBe(entityB);
    expect(propsB?.label).toBe('B');
  });

  it('scripts in scene A and scene B run update independently', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const entityA = createEntityId('entityA');
    const entityB = createEntityId('entityB');

    registerScript('tick-script', `
      return {
        init = function(self)
          self.state.ticks = 0
        end,
        update = function(self, dt)
          self.state.ticks = self.state.ticks + 1
          self.properties.tickCount = self.state.ticks
        end
      }
    `);

    addSceneWithEntity(api, sceneA, entityA);
    addEntityWithScripts(api, sceneA, entityA, [{
      scriptId: 'tick-script',
      enabled: true,
      properties: { tickCount: 0 },
    }]);

    addSceneWithEntity(api, sceneB, entityB);
    addEntityWithScripts(api, sceneB, entityB, [{
      scriptId: 'tick-script',
      enabled: true,
      properties: { tickCount: 0 },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 10, 0.016);

    const propsA = getScriptProperties(
      api.scene(sceneA).entity(entityA).component('script').snapshot(),
      0,
    );
    const propsB = getScriptProperties(
      api.scene(sceneB).entity(entityB).component('script').snapshot(),
      0,
    );

    expect(propsA?.tickCount).toBe(10);
    expect(propsB?.tickCount).toBe(10);
  });

  it('script in scene A cannot access entity or properties from scene B', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest();

    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const entityA = createEntityId('entityA');
    const entityB = createEntityId('entityB');

    registerScript('cross-scene-probe', `
      return {
        init = function(self)
          -- Try to get an entity that lives in the other scene (we pass entityB id from test).
          -- otherSceneEntityId is set by test to entityB (id of entity in scene B)
          local otherId = self.properties.otherSceneEntityId or ''
          local other = self.Scene.getEntity(otherId)
          self.properties.couldGetOtherSceneEntity = (other ~= nil)
        end
      }
    `);

    registerScript('multi-scene-script', `
      return {
        init = function(self)
          self.properties.entityId = tostring(self.entity.id)
          self.properties.label = self.properties.label or 'default'
        end,
        update = function() end
      }
    `);

    addSceneWithEntity(api, sceneA, entityA);
    addEntityWithScripts(api, sceneA, entityA, [{
      scriptId: 'cross-scene-probe',
      enabled: true,
      properties: {
        otherSceneEntityId: entityB,
        couldGetOtherSceneEntity: false,
      },
    }]);

    addSceneWithEntity(api, sceneB, entityB);
    addEntityWithScripts(api, sceneB, entityB, [{
      scriptId: 'multi-scene-script',
      enabled: true,
      properties: { entityId: '', label: 'B' },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 2, 0.016);

    const propsA = getScriptProperties(
      api.scene(sceneA).entity(entityA).component('script').snapshot(),
      0,
    );

    expect(propsA?.couldGetOtherSceneEntity).toBe(false);
  });
});
