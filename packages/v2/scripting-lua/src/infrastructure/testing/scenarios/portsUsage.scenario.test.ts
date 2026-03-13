/**
 * Scenario: Use of system ports (Input, Gizmo, Physics) and custom ports (engine_ports).
 *
 * Verifies that:
 * - Input bridge (system port) is callable from scripts (isKeyPressed, getMouseDelta)
 * - Gizmo bridge (system port) is callable from onDrawGizmos (drawLine, drawSphere)
 * - Physics bridge (system port) is callable from scripts (raycast)
 * - Custom ports via engine_ports are callable (custom port methods)
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { definePort } from '@duckengine/core-v2';
import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from '../setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testHelpers';
import { getScriptProperties } from '../testUtils';

describe('Scenario: System and custom ports usage', () => {
  it('uses Input, Gizmo, Physics (system ports) and custom port (engine_ports)', async () => {
    // 1. Define custom port
    const customAnalyticsPort = {
      trackEvent: jest.fn((event: string, data: Record<string, unknown>) => ({ event, data })),
    };
    const customPortDef = definePort<typeof customAnalyticsPort>('game:analytics')
      .addMethod('trackEvent')
      .build();

    // 2. Setup with custom port
    const { api, mocks, registerScript } = await setupScriptingIntegrationTest({
      customPorts: [customPortDef.bind(customAnalyticsPort)],
    });

    const sceneId = createSceneId('main');
    const entityId = createEntityId('player');

    // 3. Script that uses all ports:
    //    - Input (system): isKeyPressed, getMouseDelta
    //    - Gizmo (system): onDrawGizmos → drawLine, drawSphere
    //    - Physics (system): raycast
    //    - engine_ports (custom): trackEvent
    registerScript('ports-demo-script', `
      return {
        init = function(self)
          self.state.initialized = true
          -- Custom port: track spawn
          if engine_ports and engine_ports['game:analytics'] then
            engine_ports['game:analytics'].trackEvent('entity_spawned', { id = tostring(self.entity.id) })
          end
        end,
        update = function(self, dt)
          -- System ports via Engine namespace (Engine.Input, Engine.Physics)
          local Input = Engine and Engine.Input
          local Physics = Engine and Engine.Physics
          if Input then
            local space = Input.isKeyPressed('space')
            local delta = Input.getMouseDelta()
            self.properties.spacePressed = space
            self.properties.mouseDeltaX = delta and delta.x or 0
          end
          if Physics then
            local origin = math.vec3.new(0, 0, 0)
            local dir = math.vec3.new(0, -1, 0)
            local hit = Physics.raycast(origin, dir, 100)
            self.properties.raycastHit = hit ~= nil
            if hit then
              self.properties.hitEntityId = hit.entityId
              self.properties.hitDistance = hit.distance
            end
          end
        end,
        onDrawGizmos = function(self)
          local Gizmo = Engine and Engine.Gizmo
          if Gizmo then
            local pos = self.entity.components.transform.getLocalPosition()
            Gizmo.drawLine(
              { x = pos.x, y = pos.y, z = pos.z },
              { x = pos.x + 1, y = pos.y, z = pos.z }
            )
            Gizmo.drawSphere({ x = pos.x, y = pos.y + 2, z = pos.z }, 0.5)
          end
        end
      }
    `);

    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [
      {
        scriptId: 'ports-demo-script',
        enabled: true,
        properties: { spacePressed: false, mouseDeltaX: 0, raycastHit: false, hitEntityId: '', hitDistance: 0 },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 2, 0.016);

    // 4. Verify custom port was called in init
    expect(customAnalyticsPort.trackEvent).toHaveBeenCalledWith('entity_spawned', {
      id: entityId,
    });

    // 5. Verify system port Input was called in update
    expect(mocks.input.isKeyPressed).toHaveBeenCalledWith('space');
    expect(mocks.input.getMouseDelta).toHaveBeenCalled();

    // 6. Verify system port Physics was called in update
    expect(mocks.physics.raycast).toHaveBeenCalled();

    // 7. Verify system port Gizmo was called in onDrawGizmos
    expect(mocks.gizmo.drawLine).toHaveBeenCalled();
    expect(mocks.gizmo.drawSphere).toHaveBeenCalled();

    // 8. Verify properties flushed from Lua (Input/Physics results)
    const scene = api.scene(sceneId);
    const props = getScriptProperties(
      scene.entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.spacePressed).toBe(true); // mock returns true
    expect(props?.raycastHit).toBe(true); // hit ~= nil
    expect(props?.hitEntityId).toBe('hit-entity');
    expect(props?.hitDistance).toBe(10);
  });

  it('async port with callback: fetchData(id, callback) sets property when Promise resolves', async () => {
    // Use immediate resolve to avoid timing issues; callback runs in microtask
    const resolvedData = { name: 'Player1', score: 100 };
    const asyncApiPort = {
      fetchData: jest.fn((_id: string) => Promise.resolve(resolvedData)),
    };
    const asyncPortDef = definePort<typeof asyncApiPort>('game:api')
      .addMethod('fetchData', { async: true })
      .build();

    const { api, registerScript } = await setupScriptingIntegrationTest({
      customPorts: [asyncPortDef.bind(asyncApiPort)],
    });

    const sceneId = createSceneId('main');
    const entityId = createEntityId('player');

    registerScript('async-fetch-script', `
      return {
        init = function(self)
          local api = engine_ports and engine_ports['game:api']
          if api and api.fetchData then
            api.fetchData('player-123', function(err, data)
              if not err and data then
                self.properties.loadedName = data and data.name or 'no-name'
                self.properties.loadedScore = data and data.score or 0
              end
            end)
          end
        end
      }
    `);

    addSceneWithEntity(api, sceneId, entityId);
    addEntityWithScripts(api, sceneId, entityId, [
      {
        scriptId: 'async-fetch-script',
        enabled: true,
        properties: { loadedName: '', loadedScore: 0 },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(200);
    runFrames(api, 1); // init runs; fetchData returns Promise, .then queues callback
    await new Promise<void>((r) => queueMicrotask(r)); // yield so callback runs
    runFrames(api, 1); // flush dirty properties to ECS

    expect(asyncApiPort.fetchData).toHaveBeenCalledWith('player-123');

    const scene = api.scene(sceneId);
    const props = getScriptProperties(
      scene.entity(entityId).component('script').snapshot(),
      0,
    );
    expect(props?.loadedName).toBe('Player1');
    expect(props?.loadedScore).toBe(100);
  });
});
