import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > registerAdapter', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should register an engine adapter', () => {
        const mockAdapter = {
            id: 'mock-adapter',
            initialize: jest.fn(),
            update: jest.fn(),
            teardown: jest.fn()
        };

        const result = ctx.api.registerAdapter({ adapter: mockAdapter as any });
        expect(result.ok).toBe(true);
        expect(ctx.engine.engineAdapters).toContain(mockAdapter);
    });
});
