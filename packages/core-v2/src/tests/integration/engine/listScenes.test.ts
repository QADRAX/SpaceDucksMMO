import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > listScenes', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should list all scenes registered in the engine', () => {
        ctx.api.addScene({ sceneId: createSceneId('scene1') });
        ctx.api.addScene({ sceneId: createSceneId('scene2') });

        const result = ctx.api.listScenes();

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(2);
            expect(result.value.map(s => s.id)).toContain(createSceneId('scene1'));
            expect(result.value.map(s => s.id)).toContain(createSceneId('scene2'));
        }
    });

    it('should return empty list if no scenes', () => {
        const result = ctx.api.listScenes();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toHaveLength(0);
        }
    });
});
