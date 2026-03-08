import type { SceneState } from '../scene';
import type { ViewportState } from '../viewport';
import type { SubsystemRuntimeState, EngineSubsystem } from '../subsystems';
import type { SceneId, ViewportId } from '../ids';

/** Mutable engine state operated on by application-layer engine use cases. */
export interface EngineState {
  readonly scenes: Map<SceneId, SceneState>;
  readonly viewports: Map<ViewportId, ViewportState>;
  settings: GameSettings;
  paused: boolean;
  running: boolean;
  /** Engine-level subsystems (render, audio …) in pipeline order. */
  readonly engineSubsystems: EngineSubsystem[];
  /** Shared subsystem runtime: scene factories + IO port registry + derivation hooks. */
  readonly subsystemRuntime: SubsystemRuntimeState;
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
