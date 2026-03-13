import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Scene > setActiveCamera', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        const cam = createEntity(createEntityId('cam1'));
        ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
        ctx.api.scene(createSceneId('main')).entity(createEntityId('cam1')).addComponent({
            component: createComponent('cameraView') as any
        });
    });

    it('should initialize with no active camera', () => {
        expect(ctx.engine.scenes.get(createSceneId('main'))?.activeCameraId).toBeNull();
    });

    it('should set an active camera', () => {
        const result = ctx.api.scene(createSceneId('main')).setActiveCamera({ entityId: createEntityId('cam1') });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.activeCameraId).toBe(createEntityId('cam1'));
    });

    it('should clear active camera when setting to null', () => {
        ctx.api.scene(createSceneId('main')).setActiveCamera({ entityId: createEntityId('cam1') });
        expect(ctx.engine.scenes.get(createSceneId('main'))?.activeCameraId).toBe(createEntityId('cam1'));

        const result = ctx.api.scene(createSceneId('main')).setActiveCamera({ entityId: null });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.activeCameraId).toBeNull();
    });
});
