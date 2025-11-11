import type { SystemId } from './ids';
import type { SolarSystem } from './solarSystem';
import type { Vector3 } from '../types/vector';

/**
 * Representa una galaxia que contiene múltiples sistemas solares.
 */
export interface Galaxy {
  /** Identificador único de la galaxia */
  id: string;
  /** Nombre de la galaxia */
  name?: string;
  /** Colección de sistemas solares indexados por su ID */
  systems: Record<SystemId, SolarSystem>;
  /** Vector normal del plano galáctico. Se asume igual para todos los sistemas.
   *  Este vector define la orientación del plano usado para viajes intergalácticos 2D.
   *  Si no está definido, se asume { x: 0, y: 0, z: 1 } (Z arriba).
   */
  planeNormal?: Vector3;
  /** Metadatos opcionales como tamaño, escala, etc. */
  metadata?: Record<string, unknown>;
}
