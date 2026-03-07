import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > setDisplayName', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
        ctx.api.scene('main').addEntity({ entity: createEntity('e1', 'Old Name') });
    });

    it('should update the display name of an entity', () => {
        const entity = ctx.engine.scenes.get('main')?.entities.get('e1');
        expect(entity?.displayName).toBe('Old Name');

        ctx.api.scene('main').entity('e1').setDisplayName({ name: 'New Name' });
        expect(entity?.displayName).toBe('New Name');
    });
});
