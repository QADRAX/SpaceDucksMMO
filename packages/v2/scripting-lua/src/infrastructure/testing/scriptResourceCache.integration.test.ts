/**
 * Integration tests for script resource caching.
 *
 * Requires ResourceCoordinator (engineSubsystems). These tests will move to the
 * facade package when it exists; scripting-lua does not depend on resource-coordinator.
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

describe.skip('Script resource cache integration (moves to facade package)', () => {
  it('scripts go through cache when engineSubsystems includes ResourceCoordinator', async () => {
    const { api, registerScript } = await setupScriptingIntegrationTest({
      engineSubsystems: [], // TODO: facade passes [createResourceCoordinatorSubsystem({ createResourceCache: createScriptOnlyResourceCache })]
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
    const { api, registerScript } = await setupScriptingIntegrationTest({
      engineSubsystems: [],
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

    // With cache-only: scripts come from cache; no loader. Both entities share same cached script.
  });

  it('test:// scripts bypass cache (built-in resolver)', async () => {
    const { api } = await setupScriptingIntegrationTest({
      engineSubsystems: [],
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

    // test:// uses built-in resolver, not ResourceCachePort
  });
});
