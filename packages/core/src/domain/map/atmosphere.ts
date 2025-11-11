export enum AtmosphereType {
  None = 'none',
  Oxygen = 'oxygen',
  Nitrogen = 'nitrogen',
  CarbonDioxide = 'carbon_dioxide',
  Hydrogen = 'hydrogen',
  Helium = 'helium',
  Methane = 'methane',
  Ammonia = 'ammonia',
  Exotic = 'exotic'
}

/**
 * Representa la atmósfera de un planeta, incluyendo composición, presión, etc.
 */
export interface Atmosphere {
  /** Tipo de atmósfera (oxígeno, nitrógeno, etc) */
  type: AtmosphereType;
  /** Presión superficial en kPa (kilopascales) */
  pressureKPa: number;
  /** Composición aproximada por símbolo de gas */
  composition: Record<string, number>;
}
