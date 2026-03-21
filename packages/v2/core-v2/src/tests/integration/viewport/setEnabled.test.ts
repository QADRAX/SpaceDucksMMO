import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Viewport > setEnabled', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        // Viewport requires a camera entity in the scene
        const cam = createEntity(createEntityId('cam'));
        ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
            component: createComponent('cameraPerspective') as any
        });

        const result = ctx.api.addViewport({
            id: createViewportId('vp1'),
            sceneId: createSceneId('main'),
            cameraEntityId: createEntityId('cam'),
            canvasId: createCanvasId('c1')
        });
        expect(result.ok).toBe(true);
    });

    it('should toggle viewport enabled state', () => {
        const vpApi = ctx.api.viewport(createViewportId('vp1'));

        vpApi.setEnabled({ enabled: false });
        expect(ctx.engine.viewports.get(createViewportId('vp1'))?.enabled).toBe(false);

        vpApi.setEnabled({ enabled: true });
        expect(ctx.engine.viewports.get(createViewportId('vp1'))?.enabled).toBe(true);
    });
});
