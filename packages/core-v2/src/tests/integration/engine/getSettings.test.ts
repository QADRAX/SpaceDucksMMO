import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > getSettings', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should return current engine settings', () => {
        const result = ctx.api.getSettings();

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toBeDefined();
            expect(result.value.graphics).toBeDefined();
            expect(result.value.audio).toBeDefined();
            expect(result.value.gameplay).toBeDefined();
        }
    });

    it('should reflect changes made via updateSettings', () => {
        ctx.api.updateSettings({
            patch: {
                audio: { masterVolume: 0.77 }
            }
        });

        const result = ctx.api.getSettings();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.audio.masterVolume).toBe(0.77);
        }
    });
});
