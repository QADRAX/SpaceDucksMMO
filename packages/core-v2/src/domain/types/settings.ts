/** Graphics quality and rendering settings. */
export interface GraphicsSettings {
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra';
  antialias: boolean;
  shadows: boolean;
  fullscreen: boolean;
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
}

/** Player input and control settings. */
export interface GameplaySettings {
  invertMouseY: boolean;
  /** Mouse sensitivity multiplier. Range: 0.1–10. */
  mouseSensitivity: number;
}

/** Audio volume levels and mute state. */
export interface AudioSettings {
  /** Master volume. Range: 0–1. */
  masterVolume: number;
  /** Music volume. Range: 0–1. */
  musicVolume: number;
  /** Sound effects volume. Range: 0–1. */
  sfxVolume: number;
  muteAll: boolean;
}

/** Top-level game settings combining graphics, gameplay, and audio. */
export interface GameSettings {
  version?: number;
  graphics: GraphicsSettings;
  gameplay: GameplaySettings;
  audio: AudioSettings;
}

/** Sensible defaults for all game settings. */
export const DEFAULT_GAME_SETTINGS: Readonly<GameSettings> = {
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
  },
};
