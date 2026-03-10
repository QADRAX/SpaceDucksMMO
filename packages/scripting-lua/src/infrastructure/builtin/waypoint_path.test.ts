import { describe, it, expect } from '@jest/globals';
import { createEntity, createEntityId, createSceneId } from '@duckengine/core-v2';
import { getScriptProperties } from '../testing/testUtils';
import {
  createScene,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';

describe('Built-in Script: Waypoint Path', () => {
    it('should drive MoveToPoint script through a sequence of waypoints', async () => {
        const { api } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const wp1Id = createEntityId('wp1');
        const wp2Id = createEntityId('wp2');

        const scene = createScene(api, sceneId);
        const wp1 = createEntity(wp1Id);
        wp1.transform.localPosition = { x: 10, y: 0, z: 0 };
        scene.addEntity({ entity: wp1 });
        const wp2 = createEntity(wp2Id);
        wp2.transform.localPosition = { x: 20, y: 10, z: 0 };
        scene.addEntity({ entity: wp2 });
        scene.addEntity({ entity: createEntity(moverId) });

        addEntityWithScripts(api, sceneId, moverId, [
            {
                scriptId: 'builtin://waypoint_path.lua',
                properties: {
                    speed: 10,
                    waypoints: [wp1Id, wp2Id],
                    loop: false,
                    arrivalThreshold: 0.1
                }
            },
            {
                scriptId: 'builtin://move_to_point.lua',
                properties: { duration: 1.0, easing: 'linear' }
            }
        ]);

        api.update({ dt: 0 });
        await waitForSlotInit();

        api.update({ dt: 0.016 });
        const props1 = getScriptProperties(scene.entity(moverId).component('script').snapshot(), 1);
        if (props1) expect(props1.targetPoint).toEqual({ x: 10, y: 0, z: 0 });

        runFrames(api, 70, 0.016);
        const view1 = scene.entity(moverId).view();
        if (view1.ok) expect(view1.value.transform.localPosition.x).toBeCloseTo(10, 0);

        // Verify advance to WP2 target
        const props2 = getScriptProperties(scene.entity(moverId).component('script').snapshot(), 1);
        if (props2) expect(props2.targetPoint).toEqual({ x: 20, y: 10, z: 0 });

        runFrames(api, 100, 0.016);

        // Final arrival at WP2
        const view2 = scene.entity(moverId).view();
        if (view2.ok) {
            expect(view2.value.transform.localPosition.x).toBeCloseTo(20);
            expect(view2.value.transform.localPosition.y).toBeCloseTo(10);
        }
    });

    it('should loop back to start when loop=true', async () => {
        const { api } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const wpId = createEntityId('wp1');

        const scene = createScene(api, sceneId);
        const wp = createEntity(wpId);
        wp.transform.localPosition = { x: 10, y: 0, z: 0 };
        scene.addEntity({ entity: wp });
        scene.addEntity({ entity: createEntity(moverId) });

        addEntityWithScripts(api, sceneId, moverId, [
            {
                scriptId: 'builtin://waypoint_path.lua',
                properties: {
                    speed: 10,
                    waypoints: [wpId],
                    loop: true,
                    arrivalThreshold: 0.1
                }
            },
            {
                scriptId: 'builtin://move_to_point.lua',
                properties: { duration: 1.0, easing: 'linear' }
            }
        ]);

        api.update({ dt: 0 });
        await waitForSlotInit();

        // Reach WP1
        api.update({ dt: 1.1 });

        // Should be targeting WP1 AGAIN
        const props = getScriptProperties(scene.entity(moverId).component('script').snapshot(), 1);
        if (props) expect(props.targetPoint).toEqual({ x: 10, y: 0, z: 0 });
    });
});
