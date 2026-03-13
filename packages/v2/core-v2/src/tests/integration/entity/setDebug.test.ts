import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > setDebug', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
        ctx.api.scene(createSceneId('main')).addEntity({ entity: createEntity(createEntityId('e1')) });
    });

    it('should update a debug flag on an entity', () => {
        const entity = ctx.engine.scenes.get(createSceneId('main'))?.entities.get(createEntityId('e1'));
        expect(entity?.debugFlags.get('mesh')).toBeFalsy();

        ctx.api.scene(createSceneId('main')).entity(createEntityId('e1')).setDebug({ kind: 'mesh', enabled: true });
        expect(entity?.debugFlags.get('mesh')).toBe(true);
    });
});
