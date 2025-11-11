import type { SystemId } from './ids';
import type { SolarSystem } from './solarSystem';

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
  /** Metadatos opcionales como tamaño, escala, etc. */
  metadata?: Record<string, unknown>;
}
