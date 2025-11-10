import type { SystemId, PlanetId } from './ids';
import type { Position } from '../types/vector';
import type { Star } from './star';
import type { Planet } from './planet';

export interface SolarSystem {
  id: SystemId;
  name: string;
  // coordinates of the system inside the galaxy (uses Position/Vector2)
  position: Position;
  // one or more stars
  stars: Star[];
  // planets in the system
  planets: Record<PlanetId, Planet>;
}
