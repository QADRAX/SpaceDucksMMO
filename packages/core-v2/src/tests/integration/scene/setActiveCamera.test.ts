import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Scene > setActiveCamera', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });

        const cam = createEntity('cam1');
        ctx.api.scene('main').addEntity({ entity: cam });
        ctx.api.scene('main').entity('cam1').addComponent({
            component: createComponent('cameraView') as any
        });
    });

    it('should set an entity as the active camera', () => {
        expect(ctx.engine.scenes.get('main')?.activeCameraId).toBeNull();

        const result = ctx.api.scene('main').setActiveCamera({ entityId: 'cam1' });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get('main')?.activeCameraId).toBe('cam1');
    });

    it('should fail if entity does not have a cameraView component', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('no-cam') });

        const result = ctx.api.scene('main').setActiveCamera({ entityId: 'no-cam' });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message).toContain('cameraView component');
        }
    });

    it('should clear the active camera if entityId is null', () => {
        ctx.api.scene('main').setActiveCamera({ entityId: 'cam1' });
        expect(ctx.engine.scenes.get('main')?.activeCameraId).toBe('cam1');

        ctx.api.scene('main').setActiveCamera({ entityId: null });
        expect(ctx.engine.scenes.get('main')?.activeCameraId).toBeNull();
    });
});
