import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > subscribe', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should notify subscriber of entity additions', () => {
        const callback = jest.fn();
        ctx.api.scene('main').subscribe({
            listener: (ev) => {
                if (ev.kind === 'entity-added') callback(ev.entityId);
            }
        });

        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });

        expect(callback).toHaveBeenCalledWith('e1');
    });

    it('should notify subscriber of entity removals', () => {
        const callback = jest.fn();
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });

        ctx.api.scene('main').subscribe({
            listener: (ev) => {
                if (ev.kind === 'entity-removed') callback(ev.entityId);
            }
        });

        ctx.api.scene('main').removeEntity({ entityId: 'e1' });

        expect(callback).toHaveBeenCalledWith('e1');
    });
});
