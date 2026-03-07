import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Entity > setGizmoIcon', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
    });

    it('should update the gizmo icon of an entity', () => {
        const entity = ctx.engine.scenes.get('main')?.entities.get('e1');
        expect(entity?.gizmoIcon).toBeUndefined();

        ctx.api.scene('main').entity('e1').setGizmoIcon({ icon: 'camera-icon' });
        expect(entity?.gizmoIcon).toBe('camera-icon');
    });
});
