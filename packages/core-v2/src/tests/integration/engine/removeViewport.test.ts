import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Engine > removeViewport', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        const cam = createEntity(createEntityId('cam'));
        ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
            component: createComponent('cameraView') as any
        });

        ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('canvas1')
        });
    });

    it('should remove an existing viewport', () => {
        expect(ctx.engine.viewports.has(createViewportId('vp1'))).toBe(true);

        const result = ctx.api.removeViewport({ viewportId: createViewportId('vp1') });
        expect(result.ok).toBe(true);
        expect(ctx.engine.viewports.has(createViewportId('vp1'))).toBe(false);
    });

    it('should return error if viewport does not exist', () => {
        const result = ctx.api.removeViewport({ viewportId: createViewportId('non-existent') });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });
});
