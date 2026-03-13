import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity, addChild } from '../../../domain/entities/entity';

describe('Integration: Entity > listChildren', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should list direct children of an entity', () => {
        const parent = createEntity(createEntityId('p1'));
        const c1 = createEntity(createEntityId('c1'));
        const c2 = createEntity(createEntityId('c2'));
        addChild(parent, c1);
        addChild(parent, c2);

        ctx.api.scene(createSceneId('main')).addEntity({ entity: parent });

        const result = ctx.api.scene(createSceneId('main')).entity(createEntityId('p1')).listChildren();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(2);
            expect(result.value.map(c => c.id)).toContain(createEntityId('c1'));
            expect(result.value.map(c => c.id)).toContain(createEntityId('c2'));
        }
    });

    it('should return empty list if no children', () => {
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1')) });
        const result = ctx.api.scene(createSceneId('main')).entity(createEntityId('e1')).listChildren();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
