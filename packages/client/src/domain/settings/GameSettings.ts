export interface GraphicsSettings {
  // How to compute render resolution
  // 'auto' = match window size and devicePixelRatio
  // 'scale' = multiply devicePixelRatio by resolutionScale
  resolutionPolicy: 'auto' | 'scale';
  resolutionScale: number; // used when resolutionPolicy === 'scale', 0.5 - 2.0
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra' | 'custom';
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
    resolutionPolicy: 'auto',
    resolutionScale: 1.0,
    qualityPreset: 'high',
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
