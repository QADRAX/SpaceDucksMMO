import type { SystemId } from './ids';
import type { SolarSystem } from './solarSystem';

export interface Galaxy {
  id: string;
  name?: string;
  // collection of systems by id
  systems: Record<SystemId, SolarSystem>;
  // optional metadata such as size or scale (units are up to the simulation)
  metadata?: Record<string, unknown>;
}
