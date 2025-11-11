import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';
import type { GameSettings } from '@client/domain/settings/GameSettings';

export class SettingsService {
  constructor(private readonly repo: ISettingsRepository) {}

  load(): Promise<GameSettings> {
    return this.repo.load();
  }

  save(settings: GameSettings): Promise<void> {
    return this.repo.save(settings);
  }
}

export default SettingsService;
