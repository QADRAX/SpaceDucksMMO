import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Engine > removeViewport', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });

        const cam = createEntity('cam');
        ctx.api.scene('main').addEntity({ entity: cam });
        ctx.api.scene('main').entity('cam').addComponent({
            component: createComponent('cameraView') as any
        });

        ctx.api.addViewport({
            id: 'vp1',
            sceneId: 'main',
            cameraEntityId: 'cam',
            canvasId: 'canvas1'
        });
    });

    it('should remove an existing viewport', () => {
        expect(ctx.engine.viewports.has('vp1')).toBe(true);

        const result = ctx.api.removeViewport({ viewportId: 'vp1' });
        expect(result.ok).toBe(true);
        expect(ctx.engine.viewports.has('vp1')).toBe(false);
    });

    it('should return error if viewport does not exist', () => {
        const result = ctx.api.removeViewport({ viewportId: 'non-existent' });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });
});
