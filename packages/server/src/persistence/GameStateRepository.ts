import { GameState } from '@spaceducks/core';

export interface GameStateRepository {
  save(state: GameState): Promise<void>;
  load(): Promise<GameState | null>;
}
