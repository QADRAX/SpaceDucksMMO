/**
 * Integration tests for script resource caching.
 *
 * Demonstrates that scripts are coordinated via ResourceCachePort like textures/meshes:
 * - ResourceCoordinator preloads scripts on entity-added/component-changed
 * - Script resolver always reads from cache; if missing, preloadScript then read
 * - Multiple entities with same script hit cache (loader called once)
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId, createComponent } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  addEntityToScene,
  waitForSlotInit,
  runFrames,
} from './testHelpers';
import { getScriptProperties } from './testUtils';

describe('Script resource cache integration', () => {
  it('scripts go through cache when withResourceCache is true', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest({
      withResourceCache: true,
    });

    registerScript('scripts/cached-demo', `
      return {
        init = function(self)
          self.properties.loaded = true
          self.properties.source = 'cached-demo'
        end,
        update = function() end
      }
    `);

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [
      { scriptId: 'scripts/cached-demo', enabled: true, properties: { loaded: false, source: '' } },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    const props = getScriptProperties(
      api.scene(sceneId).entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.loaded).toBe(true);
    expect(props?.source).toBe('cached-demo');
  });

  it('multiple entities with same script hit cache (loader called once)', async () => {
    const { api, registerScript, mocks } = await setupScriptingIntegrationTest({
      withResourceCache: true,
    });

    registerScript('scripts/shared', `
      return {
        init = function(self) self.properties.inited = true end,
        update = function() end
      }
    `);

    const sceneId = createSceneId('main');
    const e1 = createEntityId('e1');
    const e2 = createEntityId('e2');
    addSceneWithEntity(api, sceneId, e1);
    addEntityWithScripts(api, sceneId, e1, [
      { scriptId: 'scripts/shared', enabled: true, properties: { inited: false } },
    ]);

    addEntityToScene(api, sceneId, e2);
    addEntityWithScripts(api, sceneId, e2, [
      { scriptId: 'scripts/shared', enabled: true, properties: { inited: false } },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    const props1 = getScriptProperties(
      api.scene(sceneId).entity(e1).component('script').snapshot(),
      0,
    );
    const props2 = getScriptProperties(
      api.scene(sceneId).entity(e2).component('script').snapshot(),
      0,
    );
    expect(props1?.inited).toBe(true);
    expect(props2?.inited).toBe(true);

    // ResourceCoordinator preloads on entity-added; scripting resolves from cache.
    // resolve + fetchFile should each be called once (first preload), not twice.
    const resolveCalls = (mocks.resourceLoader.resolve as jest.Mock).mock.calls.length;
    const fetchCalls = (mocks.resourceLoader.fetchFile as jest.Mock).mock.calls.length;
    expect(resolveCalls).toBe(1);
    expect(fetchCalls).toBe(1);
  });

  it('test:// scripts bypass cache (built-in resolver)', async () => {
    const { api, mocks } = await setupScriptingIntegrationTest({
      withResourceCache: true,
    });

    const sceneId = createSceneId('main');
    const entityId = createEntityId('e1');
    addSceneWithEntity(api, sceneId, entityId);
    api.scene(sceneId).entity(entityId).addComponent({
      component: createComponent('name', { value: 'Test' }),
    });
    api.scene(sceneId).entity(entityId).addComponent({
      component: createComponent('boxGeometry', { width: 1, height: 1, depth: 1 }),
    });
    addEntityWithScripts(api, sceneId, entityId, [
      {
        scriptId: 'test://component_bridge_has_getdata.lua',
        enabled: true,
        properties: { hasName: false, hasBox: false, hasScript: false, hasNonexistent: true, nameDataValue: '', boxDataWidth: 0 },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1);

    const props = getScriptProperties(
      api.scene(sceneId).entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.hasName).toBe(true);
    expect(props?.nameDataValue).toBe('Test');

    // test:// uses built-in resolver, not ResourceLoaderPort
    expect((mocks.resourceLoader.resolve as jest.Mock).mock.calls.length).toBe(0);
    expect((mocks.resourceLoader.fetchFile as jest.Mock).mock.calls.length).toBe(0);
  });
});
