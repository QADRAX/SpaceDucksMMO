import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > updateScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should trigger update on all scene adapters', () => {
        const updateSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.scene('main').setupScene({
            adapters: [mockAdapter as any]
        });

        ctx.api.scene('main').updateScene({ dt: 0.16 });

        expect(updateSpy).toHaveBeenCalledWith(ctx.engine.scenes.get('main'), 0.16);
    });

    it('should not update if scene is paused', () => {
        const updateSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.scene('main').setupScene({
            adapters: [mockAdapter as any]
        });
        ctx.api.scene('main').setPaused({ paused: true });

        ctx.api.scene('main').updateScene({ dt: 0.16 });

        expect(updateSpy).not.toHaveBeenCalled();
    });
});
