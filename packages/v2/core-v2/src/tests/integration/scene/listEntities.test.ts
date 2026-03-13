import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > listEntities', () => {
    let ctx: TestContext;
    const MAIN_SCENE = createSceneId('main');

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: MAIN_SCENE });
    });

    it('should list all entities in the scene', () => {
        const e1 = createEntityId('e1');
        const e2 = createEntityId('e2');
        ctx.api.scene(MAIN_SCENE).addEntity({ entity: createEntity(e1) });
        ctx.api.scene(MAIN_SCENE).addEntity({ entity: createEntity(e2) });

        const result = ctx.api.scene(MAIN_SCENE).listEntities();

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(2);
            expect(result.value.map(e => e.id)).toContain(e1);
            expect(result.value.map(e => e.id)).toContain(e2);
        }
    });

    it('should return empty list if no entities', () => {
        const result = ctx.api.scene(MAIN_SCENE).listEntities();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
