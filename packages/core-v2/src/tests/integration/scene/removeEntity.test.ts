import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > removeEntity', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should remove a root entity from the scene', () => {
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1')) });
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('e1'))).toBe(true);

        const result = ctx.api.scene(createSceneId('main')).removeEntity({ entityId: createEntityId('e1') });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('e1'))).toBe(false);
    });

    it('should return error if entity does not exist', () => {
        const result = ctx.api.scene(createSceneId('main')).removeEntity({ entityId: createEntityId('non-existent') });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });

    it('should remove child entities recursively', () => {
        const parent = createEntity(createEntityId('parent'));
        const child = createEntity(createEntityId('child'));
        parent.children.push(child);

        ctx.api.scene(createSceneId('main')).addEntity({ entity: parent });
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('child'))).toBe(true);

        ctx.api.scene(createSceneId('main')).removeEntity({ entityId: createEntityId('parent') });
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('parent'))).toBe(false);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.entities.has(createEntityId('child'))).toBe(false);
    });
});
