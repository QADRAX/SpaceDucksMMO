import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEngine } from '../../../domain/engine/createEngine';
import { createDuckEngineAPI } from '../../../infrastructure/api/createDuckEngineAPI';

describe('Integration: Engine > update', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should fail update when setup has not been called', () => {
        const engine = createEngine();
        const api = createDuckEngineAPI(engine);
        const result = api.update({ dt: 0.16 });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message).toContain('setup');
        }
    });

    it('should update the engine state with dt', () => {
        const result = ctx.api.update({ dt: 0.16 });
        expect(result.ok).toBe(true);
    });

    it('should trigger subsystem updates', () => {
        const updateSpy = jest.fn();
        const mockSubsystem = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.registerSubsystem({ subsystem: mockSubsystem as any });
        ctx.api.update({ dt: 0.16 });

        expect(updateSpy).toHaveBeenCalledWith(ctx.engine, 0.16);
    });

    it('should respect pause flag for subsystems', () => {
        const updateSpy = jest.fn();
        const mockSubsystem = {
            id: 'mock',
            update: updateSpy
        };

        ctx.api.registerSubsystem({ subsystem: mockSubsystem as any });
        ctx.api.setPaused({ paused: true });
        ctx.api.update({ dt: 0.16 });

        expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should run phases in fixed order', () => {
        const order: string[] = [];
        const mockSubsystem = {
            earlyUpdate: jest.fn(() => order.push('earlyUpdate')),
            physics: jest.fn(() => order.push('physics')),
            update: jest.fn(() => order.push('update')),
            lateUpdate: jest.fn(() => order.push('lateUpdate')),
            preRender: jest.fn(() => order.push('preRender')),
            render: jest.fn(() => order.push('render')),
            postRender: jest.fn(() => order.push('postRender')),
        };

        ctx.api.registerSubsystem({ subsystem: mockSubsystem as any });
        ctx.api.update({ dt: 0.16 });

        expect(order).toEqual([
            'earlyUpdate', 'physics', 'update', 'lateUpdate', 'preRender', 'render', 'postRender',
        ]);
    });
});
