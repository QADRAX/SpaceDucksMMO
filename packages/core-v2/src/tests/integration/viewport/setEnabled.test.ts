import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Viewport > setEnabled', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });

        // Viewport requires a camera entity in the scene
        const cam = createEntity('cam');
        ctx.api.scene('main').addEntity({ entity: cam });
        ctx.api.scene('main').entity('cam').addComponent({
            component: createComponent('cameraView') as any
        });

        const result = ctx.api.addViewport({
            id: 'vp1',
            sceneId: 'main',
            cameraEntityId: 'cam',
            canvasId: 'c1'
        });
        expect(result.ok).toBe(true);
    });

    it('should toggle viewport enabled state', () => {
        const vpApi = ctx.api.viewport('vp1');

        vpApi.setEnabled({ enabled: false });
        expect(ctx.engine.viewports.get('vp1')?.enabled).toBe(false);

        vpApi.setEnabled({ enabled: true });
        expect(ctx.engine.viewports.get('vp1')?.enabled).toBe(true);
    });
});
