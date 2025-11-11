import { Atmosphere } from './atmosphere';
import { Orbit } from './orbit';
import type { PlanetId } from './ids';

export enum PlanetClass {
  Rocky = 'rocky',
  Gaseous = 'gaseous'
}

export interface Planet {
  id: PlanetId;
  name: string;
  class: PlanetClass;
  massKg: number;
  radiusM: number;
  gravity: number;
  hasAtmosphere: boolean;
  atmosphere?: Atmosphere;
  orbit?: Orbit;
  moons?: Planet[];
}
