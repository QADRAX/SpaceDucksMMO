import type { Position, Velocity } from './vector';

export type EntityId = string;
export type Timestamp = number; // ms since epoch

export interface Entity {
  id: EntityId;
  position: Position;
  velocity?: Velocity;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Player extends Entity {
  username: string;
  health: number;
  maxHealth: number;
}

export interface NPC extends Entity {
  npcType: string;
}
