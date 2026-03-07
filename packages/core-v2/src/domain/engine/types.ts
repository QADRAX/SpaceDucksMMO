import type { SceneState } from '../scene';
import type { ViewportState } from '../viewport';


/** Mutable engine state operated on by application-layer engine use cases. */
export interface EngineState {
    readonly scenes: Map<string, SceneState>;
    readonly viewports: Map<string, ViewportState>;
    settings: GameSettings;
    paused: boolean;
    running: boolean;
    /** Engine-level adapters (render, audio …) in pipeline order. */
    readonly engineAdapters: EngineSystemAdapter[];
}

/**
 * An engine-level system adapter for cross-scene subsystems.
 *
 * Render and audio are typical engine adapters — they need to see
 * all scenes and viewports rather than being scoped to a single scene.
 */
export interface EngineSystemAdapter {
    /** Advance one frame tick. */
    update?(engine: EngineState, dt: number): void;
    /** If true, `update()` is called even when the engine is paused. */
    updateWhenPaused?: boolean;
    /** Release resources. */
    dispose?(): void;
}

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

