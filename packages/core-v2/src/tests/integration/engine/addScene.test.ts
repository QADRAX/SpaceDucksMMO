import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > addScene', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should add a new scene to the engine', () => {
        const result = ctx.api.addScene({ sceneId: createSceneId('main') });

        expect(result.ok).toBe(true);
        expect(ctx.engine.scenes.has(createSceneId('main'))).toBe(true);
        expect(ctx.engine.scenes.get(createSceneId('main'))?.id).toBe(createSceneId('main'));
    });

    it('should fail if scene already exists', () => {
        ctx.api.addScene({ sceneId: createSceneId('main') });
        const result = ctx.api.addScene({ sceneId: createSceneId('main') });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
        }
    });

    it('should reflect the new scene in listScenes', () => {
        ctx.api.addScene({ sceneId: createSceneId('scene-1') });
        ctx.api.addScene({ sceneId: createSceneId('scene-2') });

        const scenesResult = ctx.api.listScenes();
        expect(scenesResult.ok).toBe(true);
        if (scenesResult.ok) {
            expect(scenesResult.value).toHaveLength(2);
            expect(scenesResult.value.map(s => s.id)).toContain(createSceneId('scene-1'));
            expect(scenesResult.value.map(s => s.id)).toContain(createSceneId('scene-2'));
        }
    });
});
