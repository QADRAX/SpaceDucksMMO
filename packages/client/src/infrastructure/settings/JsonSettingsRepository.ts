import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';
import type IStorage from '@client/domain/ports/IStorage';
import type { GameSettings } from '@client/domain/settings/GameSettings';
import { defaultGameSettings } from '@client/domain/settings/GameSettings';

export class JsonSettingsRepository implements ISettingsRepository {
  private storage: IStorage;
  private key: string;

  constructor(storage: IStorage, key = 'settings') {
    this.storage = storage;
    this.key = key;
  }

  async load(): Promise<GameSettings> {
    const data = await this.storage.readJson<GameSettings>(this.key);
    return data ?? defaultGameSettings;
  }

  async save(settings: GameSettings): Promise<void> {
    await this.storage.writeJson(this.key, settings);
  }
}

export default JsonSettingsRepository;
