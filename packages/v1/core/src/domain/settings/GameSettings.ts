export interface GraphicsSettings {
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra';
  antialias: boolean;
  shadows: boolean;
  fullscreen: boolean;
  textureQuality: 'low' | 'medium' | 'high' | 'ultra'; // 2k, 4k, 8k textures
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
  version?: number;
  graphics: GraphicsSettings;
  gameplay: GameplaySettings;
  audio: AudioSettings;
}

export const defaultGameSettings: GameSettings = {
  graphics: {
    qualityPreset: 'high',
    antialias: true,
    shadows: true,
    fullscreen: false,
    textureQuality: 'high',
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
  }
};
