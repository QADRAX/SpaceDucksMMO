import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > registerSubsystem', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should register an engine subsystem', () => {
        const mockSubsystem = {
            id: 'mock-subsystem',
            initialize: jest.fn(),
            update: jest.fn(),
            teardown: jest.fn()
        };

        const result = ctx.api.registerSubsystem({ subsystem: mockSubsystem as any });
        expect(result.ok).toBe(true);
        expect(ctx.engine.engineSubsystems).toContain(mockSubsystem);
    });
});
