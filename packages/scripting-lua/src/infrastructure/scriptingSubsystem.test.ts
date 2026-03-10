/** @jest-environment node */
jest.unmock('wasmoon');

import {
    createComponent,
    createEntity,
    definePort,
} from '@duckengine/core-v2';
import type {
    EntityId,
    SceneId
} from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './testing/setup';

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
              local pressed = Input.isKeyPressed('space')
            end
          }
        `;
        registerScript('test-res', testScriptSource);

        // 4. Create scene and entity via API to ensure proper structure
        api.addScene({ sceneId: 'main' as SceneId });
        const sceneApi = api.scene('main' as SceneId);
        const entity = createEntity('e1' as EntityId);
        sceneApi.addEntity({ entity });
        const entityApi = sceneApi.entity('e1' as EntityId);

        // 5. Add script component
        const scriptComp = createComponent('script', {
            scripts: [{
                scriptId: 'test-res',
                enabled: true,
                properties: {}
            }]
        });
        entityApi.addComponent({ component: scriptComp });

        // 6. Wait for async init
        await new Promise(resolve => setTimeout(resolve, 200));

        // 7. Run an update to trigger 'update' hook and bridge calls
        api.update({ dt: 0.016 });

        // 8. Verify the Dynamic Port was called during Lua init
        expect(customFeaturePort.doSomethingCrazy).toHaveBeenCalledWith(21);

        // 9. Verify standard bridge call from update hook
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

        // 4. Create scene and entity via API
        api.addScene({ sceneId: 'main' as SceneId });
        const sceneApi = api.scene('main' as SceneId);

        const entity = createEntity('e1' as EntityId);
        sceneApi.addEntity({ entity });
        const entityApi = sceneApi.entity('e1' as EntityId);

        // 5. Add script component with initial property
        const scriptComp = createComponent('script', {
            scripts: [{
                scriptId: 'dynamic-script',
                enabled: true,
                properties: { message: '' }
            }]
        });
        entityApi.addComponent({ component: scriptComp });

        // 6. Wait for async resolving & init hook (increased delay for safety)
        await new Promise(resolve => setTimeout(resolve, 250));

        // 7. Run an engine update to flush Lua property changes to ECS components
        api.update({ dt: 0.016 });

        // 8. Verify property was updated by Lua calling the custom port
        const result = entityApi.component('script').snapshot();
        if (!result.ok) throw new Error('Snapshot failed');

        const snapshot = result.value as any;
        // In some cases, snapshot might still be the old one if reconciliation didn't run.
        // But api.update() should have triggered reconcile->runFrameHooks->flush.
        expect(snapshot.scripts[0].properties.message).toBe('Hello Duck!');
        expect(customPort.hello).toHaveBeenCalledWith('Duck');
    });
});
