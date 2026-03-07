import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Engine > removeScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should remove an existing scene from the engine', () => {
        ctx.api.addScene({ sceneId: 'main' });
        expect(ctx.engine.scenes.has('main')).toBe(true);

        const result = ctx.api.removeScene({ sceneId: 'main' });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.has('main')).toBe(false);
    });

    it('should return error if scene does not exist', () => {
        const result = ctx.api.removeScene({ sceneId: 'non-existent' });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });

    it('should fail if trying to remove a scene that is still in use by viewports', () => {
        ctx.api.addScene({ sceneId: 'main' });

        // Add a camera for the viewport
        ctx.api.scene('main').addEntity({ entity: createEntity('cam') });
        ctx.api.scene('main').entity('cam').addComponent({
            component: { type: 'cameraView', metadata: { inspector: { fields: [] } } } as any
        });

        ctx.api.addViewport({
            id: 'vp1',
            sceneId: 'main',
            cameraEntityId: 'cam',
            canvasId: 'c1'
        });

        const result = ctx.api.removeScene({ sceneId: 'main' });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message).toContain('still in use by viewports');
        }
    });
});
