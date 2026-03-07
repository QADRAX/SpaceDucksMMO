import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > setDebug', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
    });

    it('should update a debug flag on an entity', () => {
        const entity = ctx.engine.scenes.get('main')?.entities.get('e1');
        expect(entity?.debugFlags.get('mesh')).toBeFalsy();

        ctx.api.scene('main').entity('e1').setDebug({ kind: 'mesh', enabled: true });
        expect(entity?.debugFlags.get('mesh')).toBe(true);
    });
});
