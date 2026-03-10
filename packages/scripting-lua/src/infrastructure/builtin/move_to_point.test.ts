import { describe, it, expect } from '@jest/globals';
import { createEntityId, createSceneId } from '@duckengine/core-v2';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
} from '../testing/testHelpers';
import { setupScriptingIntegrationTest } from '../testing/setup';
import type { ScriptReference } from '@duckengine/core-v2';
import { getScriptComponentData } from '../testing/testUtils';

describe('Built-in Script: Move To Point', () => {
    it('should move entity from origin to target point using linear easing', async () => {
        const { api } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const scene = addSceneWithEntity(api, sceneId, moverId);
        addEntityWithScripts(api, sceneId, moverId, [{
            scriptId: 'builtin://move_to_point.lua',
            properties: {
                targetPoint: { x: 10, y: 0, z: 0 },
                duration: 1.0,
                easing: 'linear'
            }
        }]);

        api.update({ dt: 0 });
        await waitForSlotInit();

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
        const { api } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const scene = addSceneWithEntity(api, sceneId, moverId);
        addEntityWithScripts(api, sceneId, moverId, [{
            scriptId: 'builtin://move_to_point.lua',
            properties: {
                targetPoint: { x: 10, y: 0, z: 0 },
                duration: 1.0,
                delay: 1.0,
                easing: 'linear'
            }
        }]);

        api.update({ dt: 0 });
        await waitForSlotInit();

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
        const { api } = await setupScriptingIntegrationTest();
        const sceneId = createSceneId('main');
        const moverId = createEntityId('mover');
        const scene = addSceneWithEntity(api, sceneId, moverId);
        addEntityWithScripts(api, sceneId, moverId, [{
            scriptId: 'builtin://move_to_point.lua',
            properties: {
                targetPoint: { x: 10, y: 0, z: 0 },
                duration: 1.0,
                easing: 'linear'
            }
        }]);

        api.update({ dt: 0 });
        await waitForSlotInit();

        // Move to 5,0,0
        api.update({ dt: 0.5 });

        // Change target to 20,0,0
        const snap = scene.entity(moverId).component('script').snapshot();
        const data = getScriptComponentData(snap);
        if (data?.scripts?.length) {
            const updatedScripts: ScriptReference[] = [...data.scripts];
            const first = updatedScripts[0]!;
            updatedScripts[0] = {
                ...first,
                properties: { ...first.properties, targetPoint: { x: 20, y: 0, z: 0 } }
            };
            scene.entity(moverId).component('script').setField({
                fieldKey: 'scripts',
                value: updatedScripts
            });
        }

        api.update({ dt: 0 });
        await waitForSlotInit();

        // Next update should pick up change and start moving from 5 towards 20
        api.update({ dt: 0.5 });
        const view = scene.entity(moverId).view();
        if (view.ok) {
            expect(view.value.transform.localPosition.x).toBeCloseTo(12.5);
        }
    });
});
