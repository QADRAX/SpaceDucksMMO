import { GameState } from '@spaceducks/core';
import { GameStateRepository } from './GameStateRepository';
import Redis from 'ioredis';

const GAME_STATE_KEY = 'spaceducks:gamestate';

export class RedisGameStateRepository implements GameStateRepository {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async save(state: GameState): Promise<void> {
    await this.redis.set(GAME_STATE_KEY, JSON.stringify(state));
  }

  async load(): Promise<GameState | null> {
    const data = await this.redis.get(GAME_STATE_KEY);
    return data ? JSON.parse(data) as GameState : null;
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
