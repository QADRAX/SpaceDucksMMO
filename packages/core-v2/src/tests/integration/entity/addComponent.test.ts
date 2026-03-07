import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';

describe('Integration: Entity > addComponent', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
        ctx.api.scene('main').addEntity({ entity: createEntity('e1') });
    });

    it('should add a component to an entity', () => {
        const entityApi = ctx.api.scene('main').entity('e1');
        const component = createComponent('name', { value: 'Player' });

        const result = entityApi.addComponent({ component });

        expect(result.ok).toBe(true);
        const comp = ctx.engine.scenes.get('main')?.entities.get('e1')?.components.get('name');
        expect(comp).toBeDefined();
        expect((comp as any).value).toBe('Player');
    });

    it('should fail when adding a duplicate unique component', () => {
        const entityApi = ctx.api.scene('main').entity('e1');
        entityApi.addComponent({ component: createComponent('rigidBody') as any });

        const result = entityApi.addComponent({ component: createComponent('rigidBody') as any });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
        }
    });

    it('should fail when requirements are not met', () => {
        const entityApi = ctx.api.scene('main').entity('e1');
        const material = createComponent('standardMaterial') as any;

        const result = entityApi.addComponent({ component: material });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            // Changed "requires" to "required" to match domain error message
            expect(result.error.message).toContain('required');
        }
    });
});
