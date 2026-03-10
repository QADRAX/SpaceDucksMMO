import { describe, it, expect } from '@jest/globals';
import { createEntity, createComponent, createEntityId, createSceneId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from '../testing/setup';

/** Matches ScriptReference shape for test assertions (core-v2 may not export it). */
interface ScriptSlot {
  scriptId: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

async function waitForScripts(_engine: unknown) {
    // Wait a few ticks for async slot initialization
    await new Promise(resolve => setTimeout(resolve, 50));
}

describe('Built-in Script: Move To Point', () => {
    it('should move entity from origin to target point using linear easing', async () => {
        const { api, engine } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');

        api.addScene({ sceneId });
        const scene = api.scene(sceneId);

        const mover = createEntity(moverId);
        scene.addEntity({ entity: mover });

        const scriptComp = createComponent('script', {
            scripts: [{
                scriptId: 'builtin://move_to_point.lua',
                enabled: true,
                properties: {
                    targetPoint: { x: 10, y: 0, z: 0 },
                    duration: 1.0,
                    easing: 'linear'
                }
            }]
        });

        scene.entity(moverId).addComponent({ component: scriptComp });

        // Trigger reconciliation
        api.update({ dt: 0 });
        await waitForScripts(engine);

        // Verify initial state
        const view0 = scene.entity(moverId).view();
        if (view0.ok) {
            expect(view0.value.transform.localPosition.x).toBe(0);
        } else {
            throw new Error('Failed to get entity view');
        }

        // Move halfway (0.5s)
        api.update({ dt: 0.5 });
        const view1 = scene.entity(moverId).view();
        if (view1.ok) {
            expect(view1.value.transform.localPosition.x).toBeCloseTo(5);
        }

        // Complete movement
        api.update({ dt: 0.5 });
        const view2 = scene.entity(moverId).view();
        if (view2.ok) {
            expect(view2.value.transform.localPosition.x).toBeCloseTo(10);
        }
    });

    it('should respect delay before starting movement', async () => {
        const { api, engine } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');

        api.addScene({ sceneId });
        const scene = api.scene(sceneId);
        scene.addEntity({ entity: createEntity(moverId) });

        scene.entity(moverId).addComponent({
            component: createComponent('script', {
                scripts: [{
                    scriptId: 'builtin://move_to_point.lua',
                    enabled: true,
                    properties: {
                        targetPoint: { x: 10, y: 0, z: 0 },
                        duration: 1.0,
                        delay: 1.0,
                        easing: 'linear'
                    }
                }]
            })
        });

        api.update({ dt: 0 });
        await waitForScripts(engine);

        // 0.5s update (still in delay)
        api.update({ dt: 0.5 });
        const view1 = scene.entity(moverId).view();
        if (view1.ok) {
            expect(view1.value.transform.localPosition.x).toBe(0);
        }

        // 1.0s total (starting movement now)
        api.update({ dt: 0.5 });

        // 1.5s total (halfway through movement)
        api.update({ dt: 0.5 });
        const view2 = scene.entity(moverId).view();
        if (view2.ok) {
            expect(view2.value.transform.localPosition.x).toBeCloseTo(5);
        }
    });

    it('should restart movement when targetPoint property changes', async () => {
        const { api, engine } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');

        api.addScene({ sceneId });
        const scene = api.scene(sceneId);
        scene.addEntity({ entity: createEntity(moverId) });

        scene.entity(moverId).addComponent({
            component: createComponent('script', {
                scripts: [{
                    scriptId: 'builtin://move_to_point.lua',
                    enabled: true,
                    properties: {
                        targetPoint: { x: 10, y: 0, z: 0 },
                        duration: 1.0,
                        easing: 'linear'
                    }
                }]
            })
        });

        api.update({ dt: 0 });
        await waitForScripts(engine);

        // Move to 5,0,0
        api.update({ dt: 0.5 });

        // Change target to 20,0,0
        const scriptComp = scene.entity(moverId).component('script').snapshot();
        if (scriptComp.ok && scriptComp.value) {
            const data = scriptComp.value as unknown as { scripts: ScriptSlot[] };
            const updatedScripts: ScriptSlot[] = [...data.scripts];
            updatedScripts[0] = {
                ...updatedScripts[0],
                properties: { ...updatedScripts[0].properties, targetPoint: { x: 20, y: 0, z: 0 } }
            };
            scene.entity(moverId).component('script').setField({
                fieldKey: 'scripts',
                value: updatedScripts as unknown
            });
        }

        // Reconcile changes (if any slots need recreation, though shouldn't here)
        api.update({ dt: 0 });
        await waitForScripts(engine);

        // Next update should pick up change and start moving from 5 towards 20
        api.update({ dt: 0.5 });
        const view = scene.entity(moverId).view();
        if (view.ok) {
            expect(view.value.transform.localPosition.x).toBeCloseTo(12.5);
        }
    });
});
