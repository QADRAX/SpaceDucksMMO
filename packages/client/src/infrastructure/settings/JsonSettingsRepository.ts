import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';
import type IStorage from '@client/domain/ports/IStorage';
import type { GameSettings } from '@client/domain/settings/GameSettings';
import { defaultGameSettings } from '@client/domain/settings/GameSettings';
import { validateAndMigrate } from '@client/domain/settings/schema';

export class JsonSettingsRepository implements ISettingsRepository {
  private storage: IStorage;
  private key: string;

  constructor(storage: IStorage, key = 'settings') {
    this.storage = storage;
    this.key = key;
  }

  async load(): Promise<GameSettings> {
    const raw = await this.storage.readJson<unknown>(this.key);
    if (!raw) return defaultGameSettings;
    try {
      return validateAndMigrate(raw);
    } catch {
      return defaultGameSettings;
    }
  }

  async save(settings: GameSettings): Promise<void> {
    await this.storage.writeJson(this.key, { ...settings });
  }
}

export default JsonSettingsRepository;
