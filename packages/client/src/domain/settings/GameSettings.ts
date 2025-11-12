export interface GraphicsSettings {
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra';
  antialias: boolean;
  shadows: boolean;
  fullscreen: boolean;
}

export interface GameplaySettings {
  invertMouseY: boolean;
  mouseSensitivity: number; // 0.1 - 10
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
  language: string; // i18n code - moved to root level for better organization
  lastServerId?: string;
}

export const defaultGameSettings: GameSettings = {
  graphics: {
    qualityPreset: 'high',
    antialias: true,
    shadows: true,
    fullscreen: false,
  },
  gameplay: {
    invertMouseY: false,
    mouseSensitivity: 1.0,
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    muteAll: false,
  },
  language: 'en',
  lastServerId: undefined,
};
