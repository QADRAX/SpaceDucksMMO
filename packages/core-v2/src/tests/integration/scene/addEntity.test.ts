import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > addEntity', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should add a root entity to the scene', () => {
        const entity = createEntity('e1');
        const result = ctx.api.scene('main').addEntity({ entity });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get('main')?.entities.has('e1')).toBe(true);
        expect(ctx.engine.scenes.get('main')?.rootEntityIds).toContain('e1');
    });

    it('should reflect the new entity in listEntities', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
        ctx.api.scene('main').addEntity({ entity: createEntity('e2') });

        const listResult = ctx.api.scene('main').listEntities();
        expect(listResult.ok).toBe(true);
        if (listResult.ok) {
            expect(listResult.value).toHaveLength(2);
            expect(listResult.value.map(e => e.id)).toContain('e1');
            expect(listResult.value.map(e => e.id)).toContain('e2');
        }
    });
});
