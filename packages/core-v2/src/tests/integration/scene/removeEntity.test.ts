import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';

describe('Integration: Scene > removeEntity', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should remove a root entity from the scene', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
        expect(ctx.engine.scenes.get('main')?.entities.has('e1')).toBe(true);

        const result = ctx.api.scene('main').removeEntity({ entityId: 'e1' });
        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.get('main')?.entities.has('e1')).toBe(false);
    });

    it('should return error if entity does not exist', () => {
        const result = ctx.api.scene('main').removeEntity({ entityId: 'non-existent' });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('not-found');
        }
    });

    it('should remove child entities recursively', () => {
        const parent = createEntity('parent');
        const child = createEntity('child');
        parent.children.push(child);

        ctx.api.scene('main').addEntity({ entity: parent });
        expect(ctx.engine.scenes.get('main')?.entities.has('child')).toBe(true);

        ctx.api.scene('main').removeEntity({ entityId: 'parent' });
        expect(ctx.engine.scenes.get('main')?.entities.has('parent')).toBe(false);
        expect(ctx.engine.scenes.get('main')?.entities.has('child')).toBe(false);
    });
});
