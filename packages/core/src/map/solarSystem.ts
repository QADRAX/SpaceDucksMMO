import type { SystemId, PlanetId } from './ids';
import type { Position } from '../types/vector';
import type { Position3D } from '../types/vector';
import type { Star } from './star';
import type { Planet } from './planet';

/**
 * Representa un sistema solar dentro de una galaxia.
 */
export interface SolarSystem {
  /** Identificador único del sistema */
  id: SystemId;
  /** Nombre del sistema solar */
  name: string;
  /** Posición del sistema dentro de la galaxia (coordenadas 2D) */
  /** Posición galáctica del sistema (coordenadas 2D) */
  position: Position;
  /** Posición local del sistema (coordenadas 3D, para simulación interna).
   *  Se asume que `localPosition` es fija para cada sistema durante la simulación.
   *  Cuando una nave sale del sistema, la navegación pasa a 2D usando el plano galáctico.
   */
  localPosition: Position3D;
  /** Estrellas que forman el sistema */
  stars: Star[];
  /** Planetas del sistema, indexados por su ID */
  planets: Record<PlanetId, Planet>;
  /** Radio orbital del centro del sistema respecto al centro galáctico (en años luz) */
  orbitalRadiusLy?: number;
  /** Metadatos para navegación y simulación (pozos gravitacionales, tráfico, peligros, etc) */
  metadata?: {
    [key: string]: unknown;
  };
}
