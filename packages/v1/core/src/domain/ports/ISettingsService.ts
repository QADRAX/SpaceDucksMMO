import type { GameSettings } from '../settings/GameSettings';

export type SettingsListener = (settings: GameSettings) => void;

/**
 * Scene-friendly settings service abstraction.
 * Implemented by the client (e.g. SettingsService).
 */
export interface ISettingsService {
  getSettings(): GameSettings;
  subscribe(listener: SettingsListener): () => void;
}

export default ISettingsService;
