import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > update', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should update the engine state with dt', () => {
        const result = ctx.api.update({ dt: 0.16 });
        expect(result.ok).toBe(true);
    });

    it('should trigger adapter updates', () => {
        const updateSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.registerAdapter({ adapter: mockAdapter as any });
        ctx.api.update({ dt: 0.16 });

        expect(updateSpy).toHaveBeenCalledWith(ctx.engine, 0.16);
    });

    it('should respect pause flag for adapters', () => {
        const updateSpy = jest.fn();
        const mockAdapter = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.registerAdapter({ adapter: mockAdapter as any });
        ctx.api.setPaused({ paused: true });
        ctx.api.update({ dt: 0.16 });

        expect(updateSpy).not.toHaveBeenCalled();
    });
});
