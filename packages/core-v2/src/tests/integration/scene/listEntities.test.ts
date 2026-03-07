import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > listEntities', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should list all entities in the scene', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
        ctx.api.scene('main').addEntity({ entity: createEntity('e2') });

        const result = ctx.api.scene('main').listEntities();

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(2);
            expect(result.value.map(e => e.id)).toContain('e1');
            expect(result.value.map(e => e.id)).toContain('e2');
        }
    });

    it('should return empty list if no entities', () => {
        const result = ctx.api.scene('main').listEntities();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
