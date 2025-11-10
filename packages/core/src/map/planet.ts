import type { PlanetId } from './ids';
import type { Atmosphere } from './atmosphere';

export enum PlanetClass {
  Rocky = 'rocky',
  Gaseous = 'gaseous'
}

export interface Planet {
  id: PlanetId;
  name: string;
  class: PlanetClass;
  // mass in kilograms
  massKg: number;
  // mean radius in meters
  radiusM: number;
  // surface gravity in m/s^2 (can be derived but stored for convenience)
  gravity: number;
  // whether the planet has an atmosphere
  hasAtmosphere: boolean;
  atmosphere?: Atmosphere;
  // orbital parameters relative to parent star/system (simple placeholder)
  semiMajorAxisKm?: number;
  orbitalPeriodDays?: number;
}
