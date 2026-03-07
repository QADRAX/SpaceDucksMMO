import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > setupScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should trigger initialization on all scene adapters', () => {
        const eventSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            handleSceneEvent: eventSpy
        };

        ctx.api.scene('main').setupScene({
            adapters: [mockAdapter as any]
        });

        expect(eventSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ kind: 'scene-setup' })
        );
        expect(ctx.engine.scenes.get('main')?.adapters).toContain(mockAdapter);
    });
});
