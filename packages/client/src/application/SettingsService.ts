import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';
import type { GameSettings } from '@client/domain/settings/GameSettings';
import { validateAndMigrate, CURRENT_SETTINGS_VERSION } from '@client/domain/settings/schema';
import { defaultGameSettings } from '@client/domain/settings/GameSettings';

type SettingsListener = (settings: GameSettings) => void;

export class SettingsService {
  private currentSettings: GameSettings = defaultGameSettings;
  private listeners: Set<SettingsListener> = new Set();

  constructor(private readonly repo: ISettingsRepository) {}

  async load(): Promise<GameSettings> {
    const loaded = await this.repo.load();
    const fixed = validateAndMigrate(loaded);
    // If version bumped or validation adjusted shape, persist back
    if ((loaded as any)?.version !== CURRENT_SETTINGS_VERSION) {
      await this.repo.save(fixed);
    }
    this.currentSettings = fixed;
    this.notifyListeners();
    return fixed;
  }

  async save(settings: GameSettings): Promise<void> {
    const fixed = validateAndMigrate(settings);
    await this.repo.save(fixed);
    this.currentSettings = fixed;
    this.notifyListeners();
  }

  /**
   * Update settings and save immediately
   */
  async updateSettings(settings: GameSettings): Promise<void> {
    await this.save(settings);
  }

  /**
   * Get current settings (synchronous)
   */
  getSettings(): GameSettings {
    return this.currentSettings;
  }

  /**
   * Subscribe to settings changes
   * Returns unsubscribe function
   */
  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSettings));
  }
}

export default SettingsService;
