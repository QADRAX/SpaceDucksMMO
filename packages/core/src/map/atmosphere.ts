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

export interface Atmosphere {
  type: AtmosphereType;
  // surface pressure in kPa (kilopascals)
  pressureKPa: number;
  // approximate fractional composition by gas symbol (e.g. { O2: 0.21, N2: 0.78 })
  composition: Record<string, number>;
}
