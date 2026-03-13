import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Engine > removeScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should remove an existing scene from the engine', () => {
        ctx.api.addScene({ sceneId: createSceneId('main') });
        expect(ctx.engine.scenes.has(createSceneId('main'))).toBe(true);

        const result = ctx.api.removeScene({ sceneId: createSceneId('main') });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.has(createSceneId('main'))).toBe(false);
    });

    it('should return error if scene does not exist', () => {
        const result = ctx.api.removeScene({ sceneId: createSceneId('non-existent') });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });

    it('should fail if trying to remove a scene that is still in use by viewports', () => {
        ctx.api.addScene({ sceneId: createSceneId('main') });

        // Add a camera for the viewport
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('cam')) });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
            component: createComponent('cameraView') as any
        });

        ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('c1')
        });

        const result = ctx.api.removeScene({ sceneId: createSceneId('main') });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message).toContain('still in use by viewports');
        }
    });
});
