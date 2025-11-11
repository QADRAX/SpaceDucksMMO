/**
 * Constantes físicas y astronómicas de alta precisión.
 * Valores según estándares IAU (International Astronomical Union) 2015.
 */

/** Constante gravitacional (m³ kg⁻¹ s⁻²) - CODATA 2018 */
export const GRAVITATIONAL_CONSTANT = 6.67430e-11;

/** Unidad astronómica en kilómetros (2012 IAU definición exacta) */
export const ASTRONOMICAL_UNIT_KM = 149597870.700;

/** Masa del Sol en kilogramos (IAU 2015 nominal) */
export const SOLAR_MASS_KG = 1.9884e30;

/** Masa de la Tierra en kilogramos (IAU 2015 nominal) */
export const EARTH_MASS_KG = 5.97217e24;

/** Masa de la Luna en kilogramos */
export const LUNAR_MASS_KG = 7.342e22;

/** Radio ecuatorial de la Tierra en metros */
export const EARTH_RADIUS_M = 6_378_137;

/** Radio medio de la Luna en metros */
export const LUNAR_RADIUS_M = 1_737_400;

/** Año sideral en segundos (365.256363004 días) */
export const SIDEREAL_YEAR_SECONDS = 31_558_149.7635;

/** Mes sideral lunar en segundos (27.321661 días) */
export const LUNAR_SIDEREAL_MONTH_SECONDS = 2_360_591.5;

/** Pi con mayor precisión (suficiente para cálculos astronómicos) */
export const PI = Math.PI;
