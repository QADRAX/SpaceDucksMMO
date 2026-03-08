import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > addEntity', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should add a root entity to the scene', () => {
        const entity = createEntity(createEntityId('e1'));
        const result = ctx.api.scene(createSceneId('main')).addEntity({ entity });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('e1'))).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.rootEntityIds).toContain(createEntityId('e1'));
    });

    it('should reflect the new entity in listEntities', () => {
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1')) });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e2')) });

        const listResult = ctx.api.scene(createSceneId('main')).listEntities();
        expect(listResult.ok).toBe(true);
        if (listResult.ok) {
            expect(listResult.value).toHaveLength(2);
            expect(listResult.value.map(e => e.id)).toContain(createEntityId('e1'));
            expect(listResult.value.map(e => e.id)).toContain(createEntityId('e2'));
        }
    });
});
