import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Engine > updateSettings', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
    });

    it('should update engine settings', () => {
        const updateResult = ctx.api.updateSettings({
            patch: {
                graphics: {
                    qualityPreset: 'ultra',
                    shadows: true
                }
            }
        });

        expect(updateResult).toBeDefined();

        const settingsResult = ctx.api.getSettings();
        expect(settingsResult.ok).toBe(true);
        if (settingsResult.ok) {
            expect(settingsResult.value.graphics.qualityPreset).toBe('ultra');
            expect(settingsResult.value.graphics.shadows).toBe(true);
        }

        expect(ctx.engine.settings.graphics.qualityPreset).toBe('ultra');
    });

    it('should partially update settings', () => {
        const originalSfx = ctx.engine.settings.audio.sfxVolume;

        ctx.api.updateSettings({
            patch: {
                audio: { masterVolume: 0.5 }
            }
        });

        const settings = ctx.api.getSettings();
        if (settings.ok) {
            expect(settings.value.audio.masterVolume).toBe(0.5);
            expect(settings.value.audio.sfxVolume).toBe(originalSfx);
        }
    });
});
