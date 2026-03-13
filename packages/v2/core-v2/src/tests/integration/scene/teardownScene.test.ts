import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > teardownScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should trigger disposal on all scene subsystems and clear them', () => {
        const disposeSpy = jest.fn();
        const mockSubsystem = {
            id: 'mock',
            dispose: disposeSpy
        };

        ctx.api.scene(createSceneId('main')).setupScene({
            subsystems: [mockSubsystem as any]
        });

        ctx.api.scene(createSceneId('main')).teardownScene();

        expect(disposeSpy).toHaveBeenCalled();
        expect(ctx.engine.scenes.get(createSceneId('main'))?.subsystems).toHaveLength(0);
    });
});
