import { describe, it, expect } from '@jest/globals';
import { createEntity, createComponent, createEntityId, createSceneId } from '@duckengine/core-v2';
import type { ScriptComponent } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from '../testing/setup';

async function waitForScripts(_engine: any) {
    // Wait a few ticks for async slot initialization
    await new Promise(resolve => setTimeout(resolve, 50));
}

describe('Built-in Script: Waypoint Path', () => {
    it('should drive MoveToPoint script through a sequence of waypoints', async () => {
        const { api, engine } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const wp1Id = createEntityId('wp1');
        const wp2Id = createEntityId('wp2');

        api.addScene({ sceneId });
        const scene = api.scene(sceneId);

        // 1. Create waypoints
        const wp1 = createEntity(wp1Id);
        wp1.transform.localPosition = { x: 10, y: 0, z: 0 };
        scene.addEntity({ entity: wp1 });

        const wp2 = createEntity(wp2Id);
        wp2.transform.localPosition = { x: 20, y: 10, z: 0 };
        scene.addEntity({ entity: wp2 });

        // 2. Create mover with both scripts
        const mover = createEntity(moverId);
        const scriptComp = createComponent('script', {
            scripts: [
                {
                    scriptId: 'builtin://move_to_point.lua',
                    enabled: true,
                    properties: {
                        duration: 1.0,
                        easing: 'linear'
                    }
                },
                {
                    scriptId: 'builtin://waypoint_path.lua',
                    enabled: true,
                    properties: {
                        speed: 10,
                        waypoints: [wp1Id, wp2Id],
                        loop: false,
                        arrivalThreshold: 0.1
                    }
                }
            ]
        });
        scene.addEntity({ entity: mover });
        scene.entity(moverId).addComponent({ component: scriptComp });

        api.update({ dt: 0 });
        await waitForScripts(engine);

        // First update: Waypoint Path targets WP1, sets MoveToPoint properties
        api.update({ dt: 0.016 });

        // Verify MTP received target from WP1
        const scriptSnap1 = scene.entity(moverId).component('script').snapshot();
        if (scriptSnap1.ok) {
            const data = scriptSnap1.value as ScriptComponent;
            expect(data.scripts[0].properties.targetPoint).toEqual({ x: 10, y: 0, z: 0 });
        }

        // Wait for movement to WP1 (Dist 10 at speed 10 = 1s)
        api.update({ dt: 1.1 });

        // Should be at WP1 and targeting WP2
        const view1 = scene.entity(moverId).view();
        if (view1.ok) {
            expect(view1.value.transform.localPosition.x).toBeCloseTo(10);
        }

        const scriptSnap2 = scene.entity(moverId).component('script').snapshot();
        if (scriptSnap2.ok) {
            const data = scriptSnap2.value as ScriptComponent;
            expect(data.scripts[0].properties.targetPoint).toEqual({ x: 20, y: 10, z: 0 });
        }

        // Wait for movement to WP2
        // Dist from (10,0,0) to (20,10,0) is ~14.14. At speed 10, ~1.4s
        api.update({ dt: 1.5 });

        // Final arrival
        const view2 = scene.entity(moverId).view();
        if (view2.ok) {
            expect(view2.value.transform.localPosition.x).toBeCloseTo(20);
            expect(view2.value.transform.localPosition.y).toBeCloseTo(10);
        }
    });

    it('should loop back to start when loop=true', async () => {
        const { api, engine } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const wpId = createEntityId('wp1');

        api.addScene({ sceneId });
        const scene = api.scene(sceneId);

        const wp = createEntity(wpId);
        wp.transform.localPosition = { x: 10, y: 0, z: 0 };
        scene.addEntity({ entity: wp });

        scene.addEntity({ entity: createEntity(moverId) });
        scene.entity(moverId).addComponent({
            component: createComponent('script', {
                scripts: [
                    {
                        scriptId: 'builtin://move_to_point.lua',
                        enabled: true,
                        properties: { duration: 1.0, easing: 'linear' }
                    },
                    {
                        scriptId: 'builtin://waypoint_path.lua',
                        enabled: true,
                        properties: {
                            speed: 10,
                            waypoints: [wpId],
                            loop: true,
                            arrivalThreshold: 0.1
                        }
                    }
                ]
            })
        });

        api.update({ dt: 0 });
        await waitForScripts(engine);

        // Reach WP1
        api.update({ dt: 1.1 });

        // Should be targeting WP1 AGAIN
        const scriptSnap = scene.entity(moverId).component('script').snapshot();
        if (scriptSnap.ok) {
            const data = scriptSnap.value as ScriptComponent;
            expect(data.scripts[0].properties.targetPoint).toEqual({ x: 10, y: 0, z: 0 });
        }
    });
});
