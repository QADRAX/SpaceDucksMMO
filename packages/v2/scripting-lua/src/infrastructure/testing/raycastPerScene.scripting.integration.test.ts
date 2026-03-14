/**
 * Integration test: raycast from a script only hits the script's scene.
 *
 * Uses a scene-scoped mock physics port (no dependency on physics-rapier).
 * Each scene gets a mock that returns entityId 'floor-<sceneId>'; we assert
 * the script in scene A gets floor-sceneA and the script in scene B gets floor-sceneB.
 * Real engine + physics integration will live in a future facade package.
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { createScriptingSubsystem } from '../scriptingSubsystem';
import { setupScriptingIntegrationTest, createMockPhysicsPerSceneSubsystem } from './setup';
import {
  addSceneWithEntity,
  addEntityToScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from './testHelpers';
import { getScriptProperties } from './testUtils';

describe('Raycast per scene (mock physics)', () => {
  it('script in scene A gets raycast hit from scene A only; script in scene B from scene B only', async () => {
    const scriptingSubsystem = await createScriptingSubsystem();
    const mockPhysicsSubsystem = createMockPhysicsPerSceneSubsystem();

    const { api, registerScript } = await setupScriptingIntegrationTest({
      omitPhysicsFromCustomPorts: true,
      sceneSubsystems: [mockPhysicsSubsystem, scriptingSubsystem],
    });

    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const entityA = createEntityId('raycasterA');
    const entityB = createEntityId('raycasterB');

    registerScript('raycast-probe', `
      return {
        init = function(self)
          local hit = self.Scene.raycast({
            origin = { x = 0, y = 10, z = 0 },
            direction = { x = 0, y = -1, z = 0 },
            maxDistance = 20
          })
          if hit and hit.hit and hit.entity then
            self.properties.hitEntityId = hit.entity.id
          else
            self.properties.hitEntityId = nil
          end
        end
      }
    `);

    addSceneWithEntity(api, sceneA, entityA);
    addEntityToScene(api, sceneA, createEntityId('floor-sceneA'));
    addEntityWithScripts(api, sceneA, entityA, [{
      scriptId: 'raycast-probe',
      enabled: true,
      properties: { hitEntityId: '' },
    }]);

    addSceneWithEntity(api, sceneB, entityB);
    addEntityToScene(api, sceneB, createEntityId('floor-sceneB'));
    addEntityWithScripts(api, sceneB, entityB, [{
      scriptId: 'raycast-probe',
      enabled: true,
      properties: { hitEntityId: '' },
    }]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 2, 0.016);

    const propsA = getScriptProperties(
      api.scene(sceneA).entity(entityA).component('script').snapshot(),
      0,
    );
    const propsB = getScriptProperties(
      api.scene(sceneB).entity(entityB).component('script').snapshot(),
      0,
    );

    expect(propsA?.hitEntityId).toBe('floor-sceneA');
    expect(propsB?.hitEntityId).toBe('floor-sceneB');
  });
});
