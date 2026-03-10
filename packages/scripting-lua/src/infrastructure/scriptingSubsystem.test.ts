/** @jest-environment node */
jest.unmock('wasmoon');

import { definePort } from '@duckengine/core-v2';
import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './testing/setup';
import {
    addSceneWithEntity,
    addEntityWithScripts,
    waitForSlotInit,
    runFrames,
} from './testing/testHelpers';
import { getScriptProperties } from './testing/testUtils';

describe('Integration: Scripting Subsystem', () => {
    it('should inject mocked internal ports (Input, Physics, Gizmo) and dynamic custom ports into the Lua sandbox', async () => {
        // 1. Define a custom port
        const customFeaturePort = {
            doSomethingCrazy: jest.fn((val: number) => val * 2),
        };
        const customPortDef = definePort<typeof customFeaturePort>('custom:my-feature')
            .addMethod('doSomethingCrazy')
            .build();

        // 2. Setup the integration environment
        const { api, mocks, registerScript } = await setupScriptingIntegrationTest({
            customPorts: [customPortDef.bind(customFeaturePort)]
        });

        // 3. Register a test script
        const testScriptSource = `
          return { 
            init = function(self) 
              self.state.initCalled = true
              engine_ports['custom:my-feature'].doSomethingCrazy(21)
            end,
            update = function(self)
              self.state.updated = true
              local pressed = self.Input and self.Input.isKeyPressed('space')
            end
          }
        `;
        registerScript('test-res', testScriptSource);

        // 4. Create scene and entity via helpers
        const sceneId = createSceneId('main');
        const entityId = createEntityId('e1');
        addSceneWithEntity(api, sceneId, entityId);
        addEntityWithScripts(api, sceneId, entityId, [
            { scriptId: 'test-res', enabled: true, properties: {} }
        ]);

        // 5. Wait for async init
        await waitForSlotInit(200);

        // 6. Run an update to trigger 'update' hook and bridge calls
        runFrames(api, 1);

        // 7. Verify the Dynamic Port was called during Lua init
        expect(customFeaturePort.doSomethingCrazy).toHaveBeenCalledWith(21);

        // 8. Verify standard bridge call from update hook
        expect(mocks.input.isKeyPressed).toHaveBeenCalledWith('space');
    });

    it('should support full engine integration via createDuckEngineAPI', async () => {
        // 1. Define custom port
        const customPort = {
            hello: jest.fn((name: string) => `Hello ${name}!`),
        };
        const customPortDef = definePort<typeof customPort>('io:test-custom')
            .addMethod('hello')
            .build();

        // 2. Setup integration
        const { api, registerScript } = await setupScriptingIntegrationTest({
            customPorts: [customPortDef.bind(customPort)]
        });

        // 3. Register dynamic script
        // We use self.properties.message = msg. 
        // In the sandbox, this should trigger a dirty flag.
        registerScript('dynamic-script', `
            return {
                init = function(self)
                    local msg = engine_ports['io:test-custom'].hello('Duck')
                    self.properties.message = msg
                end
            }
        `);

        // 4. Create scene and entity via helpers
        const sceneId = createSceneId('main');
        const entityId = createEntityId('e1');
        addSceneWithEntity(api, sceneId, entityId);
        addEntityWithScripts(api, sceneId, entityId, [
            { scriptId: 'dynamic-script', enabled: true, properties: { message: '' } }
        ]);

        // 5. Wait for async resolving & init hook (increased delay for safety)
        await waitForSlotInit(250);

        // 6. Run an engine update to flush Lua property changes to ECS components
        runFrames(api, 1);

        // 7. Verify property was updated by Lua calling the custom port
        const entityApi = api.scene(sceneId).entity(entityId);
        const result = entityApi.component('script').snapshot();
        if (!result.ok) throw new Error('Snapshot failed');

        const props = getScriptProperties(result, 0);
        expect(props?.message).toBe('Hello Duck!');
        expect(customPort.hello).toHaveBeenCalledWith('Duck');
    });
});
