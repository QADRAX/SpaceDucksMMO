import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity, addChild } from '../../../domain/entities/entity';

describe('Integration: Entity > listChildren', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it('should list direct children of an entity', () => {
        const parent = createEntity('p1');
        const c1 = createEntity('c1');
        const c2 = createEntity('c2');
        addChild(parent, c1);
        addChild(parent, c2);

        ctx.api.scene('main').addEntity({ entity: parent });

        const result = ctx.api.scene('main').entity('p1').listChildren();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(2);
            expect(result.value.map(c => c.id)).toContain('c1');
            expect(result.value.map(c => c.id)).toContain('c2');
        }
    });

    it('should return empty list if no children', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
        const result = ctx.api.scene('main').entity('e1').listChildren();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
