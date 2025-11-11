import type { Position3D } from '../../domain/types/vector';

/**
 * Describe la órbita de un cuerpo alrededor de un centro.
 */
export interface Orbit {
  centerId: string;
  semiMajorAxis: number; // km
  eccentricity: number; // 0 = circular
  inclination: number; // grados
  period: number; // segundos
  phaseAtEpoch: number; // radianes
  centerPosition?: Position3D;
}
