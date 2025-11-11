import { z } from 'zod';
import { defaultGameSettings, type GameSettings } from './GameSettings';

export const GraphicsSettingsSchema = z.object({
  resolutionScale: z.number().min(0.5).max(2.0).default(1.0),
  fullscreen: z.boolean().default(false),
  vSync: z.boolean().default(true),
  antialias: z.boolean().default(true),
  shadows: z.boolean().default(true),
});

export const GameplaySettingsSchema = z.object({
  invertMouseY: z.boolean().default(false),
  mouseSensitivity: z.number().min(0.1).max(10).default(1.0),
  language: z.string().default('en'),
});

export const AudioSettingsSchema = z.object({
  masterVolume: z.number().min(0).max(1).default(0.8),
  musicVolume: z.number().min(0).max(1).default(0.6),
  sfxVolume: z.number().min(0).max(1).default(0.8),
  muteAll: z.boolean().default(false),
});

export const CURRENT_SETTINGS_VERSION = 1;

export const GameSettingsSchema = z.object({
  version: z.number().int().nonnegative().default(CURRENT_SETTINGS_VERSION),
  graphics: GraphicsSettingsSchema,
  gameplay: GameplaySettingsSchema,
  audio: AudioSettingsSchema,
  lastServerId: z.string().optional(),
});

export function validateAndMigrate(input: unknown): GameSettings {
  // Parse with defaults for missing fields
  const parsed = GameSettingsSchema.safeParse(input);
  if (!parsed.success) return { ...defaultGameSettings, version: CURRENT_SETTINGS_VERSION } as GameSettings & { version: number } as GameSettings;

  let data = parsed.data as GameSettings & { version?: number };

  // Future migrations can be chained here by version
  const version = (data as any).version ?? 0;
  if (version < CURRENT_SETTINGS_VERSION) {
    // Example migration placeholders
    // if (version < 1) { /* initialize new fields */ }
  }

  // Ensure version is set to current
  (data as any).version = CURRENT_SETTINGS_VERSION;
  return data as GameSettings;
}
