import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity, addChild } from '../../../domain/entities/entity';

describe('Integration: Scene > reparentEntity', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should move an entity from root to another parent', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('p1') });
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });

        expect(ctx.engine.scenes.get('main')?.rootEntityIds).toContain('e1');

        const result = ctx.api.scene('main').reparentEntity({
            childId: 'e1',
            newParentId: 'p1'
        });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get('main')?.rootEntityIds).not.toContain('e1');
        expect(ctx.engine.scenes.get('main')?.entities.get('p1')?.children.map(c => c.id)).toContain('e1');
    });

    it('should move an entity back to root if newParentId is null', () => {
        const p1 = createEntity('p1');
        const e1 = createEntity('e1');
        addChild(p1, e1);

        ctx.api.scene('main').addEntity({ entity: p1 });
        expect(ctx.engine.scenes.get('main')?.rootEntityIds).not.toContain('e1');

        const result = ctx.api.scene('main').reparentEntity({
            childId: 'e1',
            newParentId: null
        });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get('main')?.rootEntityIds).toContain('e1');
        expect(ctx.engine.scenes.get('main')?.entities.get('p1')?.children).toHaveLength(0);
    });

    it('should fail if creating a circular dependency', () => {
        const p1 = createEntity('p1');
        const e1 = createEntity('e1');
        addChild(p1, e1);
        ctx.api.scene('main').addEntity({ entity: p1 });

        const result = ctx.api.scene('main').reparentEntity({
            childId: 'p1',
            newParentId: 'e1'
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('invalid-reparent');
            expect(result.error.message).toContain('cycle');
        }
    });
});
