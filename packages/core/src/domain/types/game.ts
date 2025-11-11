import type { EntityId, Player, NPC, Timestamp } from './entity';

export interface GameState {
  tick: number;
  players: Record<EntityId, Player>;
  npcs: Record<EntityId, NPC>;
}

export type GameTick = { tick: number; dt: number; time: Timestamp };
