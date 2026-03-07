import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > setPaused', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should pause and resume the scene', () => {
        const scene = ctx.engine.scenes.get('main');
        expect(scene?.paused).toBe(false);

        ctx.api.scene('main').setPaused({ paused: true });
        expect(scene?.paused).toBe(true);

        ctx.api.scene('main').setPaused({ paused: false });
        expect(scene?.paused).toBe(false);
    });
});
