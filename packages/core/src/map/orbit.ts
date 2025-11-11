import { Position3D } from "../types/vector";

/**
 * Describe la órbita de un cuerpo alrededor de un centro (estrella, planeta, agujero negro).
 * Notas de simplificación: la orientación del plano orbital (normal) se asume global
 * y se define en la `Galaxy.planeNormal`. Al salir del sistema, los viajes usan
 * la proyección 2D sobre ese plano.
 */
export interface Orbit {
  /** ID del centro de la órbita (estrella, planeta, agujero negro) */
  centerId: string;
  /** Semieje mayor de la órbita en kilómetros */
  semiMajorAxis: number;
  /** Excentricidad (0 = circular) */
  eccentricity: number;
  /** Inclinación en grados respecto del plano local (usar el plano galáctico global) */
  inclination: number;
  /** Periodo orbital en segundos */
  period: number;
  /** Fase inicial en radianes */
  phaseAtEpoch: number;
  /** Posición opcional del centro de la órbita en coordenadas locales 3D.
   */
  centerPosition?: Position3D;
}