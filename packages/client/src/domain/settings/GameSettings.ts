export interface GraphicsSettings {
  resolutionScale: number; // 0.5 - 2.0
  fullscreen: boolean;
  vSync: boolean;
  antialias: boolean;
  shadows: boolean;
}

export interface GameplaySettings {
  invertMouseY: boolean;
  mouseSensitivity: number; // 0.1 - 10
  language: string; // i18n code
}

export interface AudioSettings {
  masterVolume: number; // 0 - 1
  musicVolume: number;  // 0 - 1
  sfxVolume: number;    // 0 - 1
  muteAll: boolean;
}

export interface GameSettings {
  // Optional schema version for migrations; filled by validator when present
  version?: number;
  graphics: GraphicsSettings;
  gameplay: GameplaySettings;
  audio: AudioSettings;
  lastServerId?: string;
}

export const defaultGameSettings: GameSettings = {
  graphics: {
    resolutionScale: 1.0,
    fullscreen: false,
    vSync: true,
    antialias: true,
    shadows: true,
  },
  gameplay: {
    invertMouseY: false,
    mouseSensitivity: 1.0,
    language: 'en',
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    muteAll: false,
  },
  lastServerId: undefined,
};
