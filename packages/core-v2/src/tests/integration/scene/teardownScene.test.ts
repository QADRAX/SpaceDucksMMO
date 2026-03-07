import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > teardownScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should trigger disposal on all scene adapters and clear them', () => {
        const disposeSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            dispose: disposeSpy
        };

        ctx.api.scene('main').setupScene({
            adapters: [mockAdapter as any]
        });

        ctx.api.scene('main').teardownScene();

        expect(disposeSpy).toHaveBeenCalled();
        expect(ctx.engine.scenes.get('main')?.adapters).toHaveLength(0);
    });
});
