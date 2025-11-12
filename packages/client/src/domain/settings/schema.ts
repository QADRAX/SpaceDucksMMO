import { z } from 'zod';
import { defaultGameSettings, type GameSettings } from './GameSettings';

export const GraphicsSettingsSchema = z.object({
  qualityPreset: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
  antialias: z.boolean().default(true),
  shadows: z.boolean().default(true),
  fullscreen: z.boolean().default(false),
  textureQuality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
});

export const GameplaySettingsSchema = z.object({
  invertMouseY: z.boolean().default(false),
  mouseSensitivity: z.number().min(0.1).max(10).default(1.0),
});

export const AudioSettingsSchema = z.object({
  masterVolume: z.number().min(0).max(1).default(0.8),
  musicVolume: z.number().min(0).max(1).default(0.6),
  sfxVolume: z.number().min(0).max(1).default(0.8),
  muteAll: z.boolean().default(false),
});

export const CURRENT_SETTINGS_VERSION = 3; // Bumped for textureQuality field

export const GameSettingsSchema = z.object({
  version: z.number().int().nonnegative().default(CURRENT_SETTINGS_VERSION),
  graphics: GraphicsSettingsSchema,
  gameplay: GameplaySettingsSchema,
  audio: AudioSettingsSchema,
  language: z.string().default('en'),
  lastServerId: z.string().optional(),
});

export function validateAndMigrate(input: unknown): GameSettings {
  // Parse with defaults for missing fields
  const parsed = GameSettingsSchema.safeParse(input);
  if (!parsed.success) return { ...defaultGameSettings, version: CURRENT_SETTINGS_VERSION } as GameSettings & { version: number } as GameSettings;

  let data = parsed.data as GameSettings & { version?: number };

  // Migrate from version 1 to version 2: move gameplay.language to root level
  const version = (data as any).version ?? 0;
  if (version < 2) {
    const oldSettings = data as any;
    if (oldSettings.gameplay?.language && !data.language) {
      data.language = oldSettings.gameplay.language;
    }
  }

  // Ensure version is set to current
  (data as any).version = CURRENT_SETTINGS_VERSION;
  return data as GameSettings;
}
