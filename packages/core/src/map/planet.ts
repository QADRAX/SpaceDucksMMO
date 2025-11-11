import { Atmosphere } from './atmosphere';
import { PlanetId } from './ids';

/**
 * Clase de planeta según su composición principal.
 */
export enum PlanetClass {
  Rocky = 'rocky',
  Gaseous = 'gaseous'
}

/**
 * Representa un planeta dentro de un sistema solar o como luna de otro planeta.
 * Permite definir su órbita y lunas.
 */
export interface Planet {
  /** Identificador único del planeta */
  id: PlanetId;
  /** Nombre del planeta */
  name: string;
  /** Clase del planeta (rocoso, gaseoso, etc) */
  class: PlanetClass;
  /** Masa en kilogramos */
  massKg: number;
  /** Radio medio en metros */
  radiusM: number;
  /** Gravedad superficial en m/s^2 */
  gravity: number;
  /** Indica si el planeta tiene atmósfera */
  hasAtmosphere: boolean;
  /** Detalles de la atmósfera si existe */
  atmosphere?: Atmosphere;
  /** Parámetros orbitales respecto a su centro (estrella, planeta, etc) */
  orbit?: import('./orbit').Orbit;
  /** Lunas del planeta */
  moons?: Planet[];
}