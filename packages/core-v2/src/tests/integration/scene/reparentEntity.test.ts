import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import type { EntityState } from '../../../domain/entities/types';

describe('Integration: Scene > reparentEntity', () => {
    let ctx: TestContext;
    let p1: EntityState;
    let p2: EntityState;
    let e1: EntityState;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });

        p1 = createEntity(createEntityId('p1'));
        p2 = createEntity(createEntityId('p2'));
        e1 = createEntity(createEntityId('e1'));

        ctx.api.scene(createSceneId('main')).addEntity({ entity: p1 });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: p2 });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: e1 });

        expect(ctx.engine.scenes.get(createSceneId('main'))?.rootEntityIds).toContain(createEntityId('e1'));
    });

    it('should move an entity from root to another parent', () => {
        const result = ctx.api.scene(createSceneId('main')).reparentEntity({
            childId: createEntityId('e1'),
            newParentId: createEntityId('p1')
        });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.rootEntityIds).not.toContain(createEntityId('e1'));
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.get(createEntityId('p1'))?.children.map(c => c.id)).toContain(createEntityId('e1'));
    });

    it('should move an entity back to root if newParentId is null', () => {
        ctx.api.scene(createSceneId('main')).reparentEntity({
            childId: createEntityId('e1'),
            newParentId: createEntityId('p1')
        });
        expect(ctx.engine.scenes.get(createSceneId('main'))?.rootEntityIds).not.toContain(createEntityId('e1'));

        const result = ctx.api.scene(createSceneId('main')).reparentEntity({
            childId: createEntityId('e1'),
            newParentId: null
        });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.rootEntityIds).toContain(createEntityId('e1'));
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.get(createEntityId('p1'))?.children).toHaveLength(0);
    });

    it('should fail if creating a circular dependency', () => {
        // 1. p1 becomes child of e1 (e1 is parent)
        const r1 = ctx.api.scene(createSceneId('main')).reparentEntity({
            childId: createEntityId('p1'),
            newParentId: createEntityId('e1')
        });
        expect(r1.ok).toBe(true);

        // 2. Try to make e1 a child of p1 (Cycle!)
        const circularResult = ctx.api.scene(createSceneId('main')).reparentEntity({
            childId: createEntityId('e1'),
            newParentId: createEntityId('p1')
        });

        expect(circularResult.ok).toBe(false);
        if (!circularResult.ok) {
            expect(circularResult.error.code).toBe('invalid-reparent');
            expect(circularResult.error.message).toContain('cycle');
        }
    });
});
