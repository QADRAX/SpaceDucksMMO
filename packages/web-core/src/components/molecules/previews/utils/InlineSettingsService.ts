import { type GameSettings, type ISettingsService } from '@duckengine/rendering-three';

const defaultSettings: GameSettings = {
    graphics: {
        qualityPreset: 'high',
        antialias: true,
        shadows: true,
        fullscreen: false,
        textureQuality: 'high',
    },
    gameplay: { invertMouseY: false, mouseSensitivity: 1 },
    audio: { masterVolume: 0, musicVolume: 0, sfxVolume: 0, muteAll: true },
};

export class InlineSettingsService implements ISettingsService {
    private settings: GameSettings;

    constructor(overrides?: Partial<GameSettings>) {
        this.settings = { ...defaultSettings, ...overrides };
    }

    getSettings() {
        return this.settings;
    }

    subscribe() {
        return () => { };
    }
}
