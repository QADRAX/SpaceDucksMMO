/**
 * Integration tests that progressively isolate scripting subsystem components.
 *
 * Uses test:// scripts from res/scripts/tests/ (generated into TestScripts).
 * Each test targets a specific component to help pinpoint async/bridge failures.
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createEntityId, createSceneId, definePort } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './setup';
import { getScriptProperties } from './testUtils';
import { addSceneWithEntity, addEntityWithScripts, waitForSlotInit } from './testHelpers';

const MAIN_SCENE = createSceneId('main');
const ENTITY_E1 = createEntityId('e1');

describe('Component isolation: test:// scripts', () => {
  describe('Level 0: init hook only (no bridges, no entity)', () => {
    it('minimal_init: init runs and sets properties.initCalled', async () => {
      const { api } = await setupScriptingIntegrationTest();
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_init.lua',
        properties: { initCalled: false }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);
      api.update({ dt: 0.016 });

      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.initCalled).toBe(true);
    });
  });

  describe('Level 1: properties proxy', () => {
    it('minimal_properties: init writes to properties, flush to ECS', async () => {
      const { api } = await setupScriptingIntegrationTest();
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_properties.lua',
        properties: { foo: '' }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);
      api.update({ dt: 0.016 });

      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.foo).toBe('bar');
    });
  });

  describe('Level 2: engine_ports (no entity bridge)', () => {
    it('minimal_engine_ports: init calls custom port via engine_ports', async () => {
      const customPort = { hello: jest.fn((n: string) => `Hello ${n}!`) };
      const portDef = definePort<typeof customPort>('io:test-custom').addMethod('hello').build();

      const { api } = await setupScriptingIntegrationTest({
        customPorts: [portDef.bind(customPort)]
      });
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_engine_ports.lua',
        properties: { portKey: 'io:test-custom', greeting: '' }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);
      api.update({ dt: 0.016 });

      expect(customPort.hello).toHaveBeenCalledWith('Test');
      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.greeting).toBe('Hello Test!');
    });
  });

  describe('Level 3: update hook pipeline', () => {
    it('minimal_update: update runs and increments properties.updateCount', async () => {
      const { api } = await setupScriptingIntegrationTest();
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_update.lua',
        properties: { updateCount: 0 }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);

      api.update({ dt: 0.016 });
      api.update({ dt: 0.016 });
      api.update({ dt: 0.016 });

      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.updateCount).toBe(3);
    });
  });

  describe('Level 4: entity + transform bridge (isolates "then" error)', () => {
    /**
     * FAILS with: TypeError: Cannot read properties of null (reading 'then')
     * Root cause: wasmoon JS↔Lua bridge when Lua calls a method on an object
     * passed via the entity proxy (self.entity.components.transform).
     * Levels 0–3 pass; only the transform bridge path triggers this.
     */
    it('minimal_transform_global: init calls self.Transform.getLocalPosition() (bridge shortcut)', async () => {
      const { api } = await setupScriptingIntegrationTest();
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_transform_global.lua',
        properties: { initCalled: false, startX: 0, startY: 0, startZ: 0 }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);
      api.update({ dt: 0.016 });

      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.initCalled).toBe(true);
      expect(props!.startX).toBe(0);
      expect(props!.startY).toBe(0);
      expect(props!.startZ).toBe(0);
    });

    it('minimal_transform: init calls self.entity.components.transform.getLocalPosition', async () => {
      const { api } = await setupScriptingIntegrationTest();
      const scene = addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);
      addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [{
        scriptId: 'test://minimal_transform.lua',
        properties: { initCalled: false, startX: 0, startY: 0, startZ: 0 }
      }]);

      api.update({ dt: 0 });
      await waitForSlotInit(100);
      api.update({ dt: 0.016 });

      const snap = scene.entity(ENTITY_E1).component('script').snapshot();
      expect(snap.ok).toBe(true);
      const props = getScriptProperties(snap);
      expect(props).not.toBeNull();
      expect(props!.initCalled).toBe(true);
      expect(props!.startX).toBe(0);
      expect(props!.startY).toBe(0);
      expect(props!.startZ).toBe(0);
    });
  });
});
