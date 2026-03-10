import { createEntity, createComponent, EntityId } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from './testing/setup';

describe('Built-in Scripts V2 Migration', () => {
    it('should drive move_to_point from waypoint_path successfully', async () => {
        const { api } = await setupScriptingIntegrationTest();

        // 1. Create waypoint entities
        const wp1 = createEntity('wp1' as EntityId);
        wp1.transform.localPosition = { x: 10, y: 0, z: 0 };
        const wp2 = createEntity('wp2' as EntityId);
        wp2.transform.localPosition = { x: 20, y: 10, z: 0 };

        api.addScene({ sceneId: 'main' as any });
        const sceneApi = api.scene('main' as any);

        sceneApi.addEntity({ entity: wp1 });
        sceneApi.addEntity({ entity: wp2 });

        // 2. Create the moving entity with both scripts
        const mover = createEntity('mover' as EntityId);
        const scriptComp = createComponent('script', {
            scripts: [
                {
                    scriptId: 'builtin://move_to_point.lua',
                    enabled: true,
                    properties: {
                        duration: 1, // 1 second
                        easing: 'linear',
                    },
                },
                {
                    scriptId: 'builtin://waypoint_path.lua',
                    enabled: true,
                    properties: {
                        speed: 10,
                        waypoints: [wp1.id, wp2.id],
                        loop: false,
                        arrivalThreshold: 0.1,
                    },
                },
            ],
        });

        sceneApi.addEntity({ entity: mover });
        const moverApi = sceneApi.entity('mover' as any);
        moverApi.addComponent({ component: scriptComp });

        // Initial update to trigger initialization and first waypoint target
        api.update({ dt: 0.016 });

        // Verify Waypoint Path picked up WP1 and set target on MoveToPoint
        const moverInScene = sceneApi.entity('mover' as any);
        const scriptSnap = moverInScene.component('script').snapshot();
        if (!scriptSnap.ok) throw new Error('Failed to get script snapshot');
        const mtp = (scriptSnap.value as any).scripts[0];

        // MTP targetPoint should be WP1 position
        expect(mtp.properties.targetPoint).toEqual({ x: 10, y: 0, z: 0 });

        // 3. Move towards WP1 (takes 1 second at speed 10)
        // We simulate 0.5s
        api.update({ dt: 0.5 });

        // Mover should be halfway to WP1 (5, 0, 0)
        let posAtHalfSnap = moverInScene.component('transform' as any).snapshot();
        if (!posAtHalfSnap.ok) throw new Error('Failed to get transform snapshot');
        let posAtHalf = posAtHalfSnap.value as any;
        expect(posAtHalf.worldPosition.x).toBeCloseTo(5);

        // Complete movement to WP1
        api.update({ dt: 0.6 }); // 1.1s total

        // Should be at WP1 and Waypoint Path should target WP2
        let currentPosSnap = moverInScene.component('transform' as any).snapshot();
        let pMtpSnap = moverInScene.component('script' as any).snapshot();
        if (!currentPosSnap.ok || !pMtpSnap.ok) throw new Error('Snapshots failed');

        let currentPos = currentPosSnap.value as any;
        let pMtp = (pMtpSnap.value as any).scripts[0];

        expect(currentPos.worldPosition.x).toBeCloseTo(10);
        expect(pMtp.properties.targetPoint).toEqual({ x: 20, y: 10, z: 0 });

        // 4. Move towards WP2
        // Dist from (10,0,0) to (20,10,0) is sqrt(10^2 + 10^2) = ~14.14
        // At speed 10, takes ~1.4s
        api.update({ dt: 1.5 });

        // Should be at WP2
        let finalPosSnap = moverInScene.component('transform' as any).snapshot();
        if (!finalPosSnap.ok) throw new Error('Failed to get final pos snapshot');
        let finalPos = finalPosSnap.value as any;
        expect(finalPos.worldPosition.x).toBeCloseTo(20);
        expect(finalPos.worldPosition.y).toBeCloseTo(10);
    });
});
