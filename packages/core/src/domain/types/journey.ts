import type { ShipId } from './fleet';
import type { PlanetId } from '../map/ids';
import type { Position } from './vector';
import type { Timestamp } from './entity';

export type JourneyId = string;

export interface Journey {
  id: JourneyId;
  shipId: ShipId;
  origin: PlanetId;
  destination: PlanetId;
  maneuvers: ManeuverStep[];
  status: 'planned' | 'in-progress' | 'completed' | 'aborted';
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface ManeuverStep {
  type: 'orbit-insertion' | 'burn' | 'gravity-assist' | 'coast' | 'rendezvous' | 'docking';
  fromPosition: Position;
  toPosition: Position;
  deltaV: number;
  duration: number;
  description?: string;
  executedAt?: Timestamp;
}
