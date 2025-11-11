import type { StarId } from './ids';

/**
 * Representa una estrella dentro de un sistema solar.
 */
export interface Star {
  /** Identificador único de la estrella */
  id: StarId;
  /** Nombre de la estrella */
  name?: string;
  /** Masa en kilogramos */
  massKg: number;
  /** Radio en metros */
  radiusM: number;
  /** Temperatura efectiva en Kelvin */
  temperatureK?: number;
  /** Tipo espectral (ejemplo: G2V) */
  spectralType?: string;
}
