import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > setPaused', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should pause and resume the engine', () => {
        expect(ctx.engine.paused).toBe(false);

        ctx.api.setPaused({ paused: true });
        expect(ctx.engine.paused).toBe(true);

        ctx.api.setPaused({ paused: false });
        expect(ctx.engine.paused).toBe(false);
    });
});
