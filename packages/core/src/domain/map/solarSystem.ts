import type { SystemId, PlanetId } from './ids';
import type { Position, Position3D } from '../types/vector';
import type { Star } from './star';
import type { Planet } from './planet';

export interface SolarSystem {
  id: SystemId;
  name: string;
  position: Position; // 2D galáctica
  localPosition: Position3D; // 3D local
  stars: Star[];
  planets: Record<PlanetId, Planet>;
  orbitalRadiusLy?: number;
  metadata?: { [key: string]: unknown };
}
