import type { GameSettings } from '@client/domain/settings/GameSettings';

export interface ISettingsRepository {
  load(): Promise<GameSettings>;
  save(settings: GameSettings): Promise<void>;
}

export default ISettingsRepository;
