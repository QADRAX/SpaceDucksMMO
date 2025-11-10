import type { StarId } from './ids';

export interface Star {
  id: StarId;
  name?: string;
  // mass in kilograms
  massKg: number;
  // radius in meters
  radiusM: number;
  // effective temperature in Kelvin
  temperatureK?: number;
  // spectral class / type (e.g., G2V)
  spectralType?: string;
}
