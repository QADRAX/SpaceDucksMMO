import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > updateScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should trigger update on all scene subsystems', () => {
        const updateSpy = jest.fn();
        const mockSubsystem = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.scene(createSceneId('main')).setupScene({
            subsystems: [mockSubsystem as any]
        });

        ctx.api.scene(createSceneId('main')).updateScene({ dt: 0.16 });

        expect(updateSpy).toHaveBeenCalledWith(ctx.engine.scenes.get(createSceneId('main')), 0.16);
    });

    it('should not update if scene is paused', () => {
        const updateSpy = jest.fn();
        const mockSubsystem = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.scene(createSceneId('main')).setupScene({
            subsystems: [mockSubsystem as any]
        });
        ctx.api.scene(createSceneId('main')).setPaused({ paused: true });

        ctx.api.scene(createSceneId('main')).updateScene({ dt: 0.16 });

        expect(updateSpy).not.toHaveBeenCalled();
    });
});
