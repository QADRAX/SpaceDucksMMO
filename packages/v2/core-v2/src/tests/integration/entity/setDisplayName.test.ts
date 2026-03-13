import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > setDisplayName', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1'), 'Old Name') });
    });

    it('should update the display name of an entity', () => {
        const entity = ctx.engine.scenes.get(createSceneId('main'))?.entities.get(createEntityId('e1'));
        expect(entity?.displayName).toBe('Old Name');

        ctx.api.scene(createSceneId('main')).entity(createEntityId('e1')).setDisplayName({ name: 'New Name' });
        expect(entity?.displayName).toBe('New Name');
    });
});
