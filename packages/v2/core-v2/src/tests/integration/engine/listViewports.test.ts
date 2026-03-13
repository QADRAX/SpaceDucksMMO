import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Engine > listViewports', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        const cam = createEntity(createEntityId('cam'));
        ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
            component: createComponent('cameraView') as any
        });
    });

    it('should list all viewports registered in the engine', () => {
        ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('c1')
        });

        const result = ctx.api.listViewports();

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].id).toBe(createViewportId('vp1'));
        }
    });

    it('should return empty list if no viewports', () => {
        const result = ctx.api.listViewports();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
