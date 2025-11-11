import type { EntityId } from './entity';
import { Journey } from './journey';
import type { Position, Velocity } from './vector';

export type FleetId = string;
export type ShipId = string;

export interface Fleet {
  id: FleetId;
  ownerId: EntityId;
  ships: Record<ShipId, Ship>;
}

export interface Ship {
  id: ShipId;
  name: string;
  type: string;
  position: Position;
  velocity: Velocity;
  massKg: number;
  fuelKg: number;
  cargo: Cargo[];
  status: 'idle' | 'enroute' | 'docked' | 'maneuvering';
  currentJourney?: Journey;
}

export interface Cargo {
  type: string;
  amount: number;
}
