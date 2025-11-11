import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';
import type { GameSettings } from '@client/domain/settings/GameSettings';
import { validateAndMigrate, CURRENT_SETTINGS_VERSION } from '@client/domain/settings/schema';

export class SettingsService {
  constructor(private readonly repo: ISettingsRepository) {}

  async load(): Promise<GameSettings> {
    const loaded = await this.repo.load();
    const fixed = validateAndMigrate(loaded);
    // If version bumped or validation adjusted shape, persist back
    if ((loaded as any)?.version !== CURRENT_SETTINGS_VERSION) {
      await this.repo.save(fixed);
    }
    return fixed;
  }

  save(settings: GameSettings): Promise<void> {
    const fixed = validateAndMigrate(settings);
    return this.repo.save(fixed);
  }
}

export default SettingsService;
