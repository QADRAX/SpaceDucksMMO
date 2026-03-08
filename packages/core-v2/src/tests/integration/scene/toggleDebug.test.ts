import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > toggleDebug', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: createSceneId('main') });
    });

    it('should toggle debug flags for the scene', () => {
        const scene = ctx.engine.scenes.get(createSceneId('main'));
        // Initial state check - if not present, it's effectively false
        expect(scene?.debugFlags.get('physics')).toBeFalsy();

        ctx.api.scene(createSceneId('main')).toggleDebug({
            kind: 'physics',
            enabled: true
        });

        expect(scene?.debugFlags.get('physics')).toBe(true);

        ctx.api.scene(createSceneId('main')).toggleDebug({
            kind: 'physics',
            enabled: false
        });

        expect(scene?.debugFlags.get('physics')).toBe(false);
    });
});
