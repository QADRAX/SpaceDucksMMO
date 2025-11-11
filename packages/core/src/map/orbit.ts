/**
 * Describe la órbita de un cuerpo alrededor de un centro (estrella, planeta, agujero negro).
 */
export interface Orbit {
  /** ID del centro de la órbita (estrella, planeta, agujero negro) */
  centerId: string;
  /** Semieje mayor de la órbita en kilómetros */
  semiMajorAxis: number;
  /** Excentricidad (0 = circular) */
  eccentricity: number;
  /** Inclinación en grados respecto al plano local */
  inclination: number;
  /** Periodo orbital en segundos */
  period: number;
  /** Fase inicial en radianes */
  phaseAtEpoch: number;
}