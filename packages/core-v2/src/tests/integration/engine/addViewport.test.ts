import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Engine > addViewport', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        // Add a camera entity to the scene
        const cam = createEntity(createEntityId('cam'));
        ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
            component: createComponent('cameraView') as any
        });
    });

    it('should add a viewport to the engine', () => {
        const result = ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('canvas1')
        });

        expect(result.ok).toBe(true);
        expect(ctx.engine.viewports.has(createViewportId('vp1'))).toBe(true);

        if (result.ok) {
            expect(result.value.id).toBe(createViewportId('vp1'));
            expect(result.value.sceneId).toBe(createSceneId('main'));
            expect(result.value.cameraEntityId).toBe(createEntityId('cam'));
        }
    });

    it('should fail if scene does not exist', () => {
        const result = ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('non-existent'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('canvas1')
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });

    it('should fail if camera entity does not exist in scene', () => {
        const result = ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('non-existent-cam'),
            canvasId: createCanvasId('canvas1')
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
            expect(result.error.message).toContain('Camera entity');
        }
    });

    it('should fail if viewport with same ID already exists', () => {
        ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('canvas1')
        });

        const result = ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('canvas2')
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message).toContain('already exists');
        }
    });
});
