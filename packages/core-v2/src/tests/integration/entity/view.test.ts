import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > view', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1'), 'Test Entity') });
    });

    it('should return a read-only view of the entity', () => {
        const result = ctx.api.scene(createSceneId('main')).entity(createEntityId('e1')).view();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.id).toBe(createEntityId('e1'));
            expect(result.value.displayName).toBe('Test Entity');
        }
    });
});
