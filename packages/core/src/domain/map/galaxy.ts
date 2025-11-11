import type { SystemId } from './ids';
import type { SolarSystem } from './solarSystem';
import type { Vector3 } from '../types/vector';

export interface Galaxy {
  id: string;
  name?: string;
  systems: Record<SystemId, SolarSystem>;
  planeNormal?: Vector3;
  metadata?: Record<string, unknown>;
}
