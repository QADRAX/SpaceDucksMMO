import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > subscribe', () => {
    let ctx: TestContext;
    const MAIN_SCENE = createSceneId('main');

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: MAIN_SCENE });
    });

    it('should notify subscriber of entity additions', () => {
        const callback = jest.fn();
        ctx.api.scene(MAIN_SCENE).subscribe({
            listener: (ev) => {
                if (ev.kind === 'entity-added') callback(ev.entityId);
            }
        });

        const e1 = createEntityId('e1');
        ctx.api.scene(MAIN_SCENE).addEntity({ entity: createEntity(e1) });

        expect(callback).toHaveBeenCalledWith(e1);
    });

    it('should notify subscriber of entity removals', () => {
        const callback = jest.fn();
        const e1 = createEntityId('e1');
        ctx.api.scene(MAIN_SCENE).addEntity({ entity: createEntity(e1) });

        ctx.api.scene(MAIN_SCENE).subscribe({
            listener: (ev) => {
                if (ev.kind === 'entity-removed') callback(ev.entityId);
            }
        });

        ctx.api.scene(MAIN_SCENE).removeEntity({ entityId: e1 });

        expect(callback).toHaveBeenCalledWith(e1);
    });
});
