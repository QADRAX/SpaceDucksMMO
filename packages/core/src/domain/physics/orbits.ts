import type { Planet } from '../map/planet';
import type { Position3D } from '../types/vector';
import type { Orbit } from '../map/orbit';

/**
 * Módulo de física orbital pura (sin side effects).
 * Funciones para calcular y avanzar órbitas de cuerpos celestes.
 */

/**
 * Avanza la fase orbital de un planeta dado un delta de tiempo.
 * Modifica directamente el campo `phaseAtEpoch` de la órbita.
 * 
 * @param planet - Planeta cuya órbita se avanzará
 * @param dtSec - Delta de tiempo en segundos
 */
export function advanceOrbit(planet: Planet, dtSec: number): void {
  if (planet.orbit && planet.orbit.period > 0) {
    const delta = (2 * Math.PI * dtSec) / planet.orbit.period;
    planet.orbit.phaseAtEpoch = (planet.orbit.phaseAtEpoch + delta) % (2 * Math.PI);
  }
  
  // Recursivamente avanzar órbitas de las lunas
  if (planet.moons) {
    for (const moon of planet.moons) {
      advanceOrbit(moon, dtSec);
    }
  }
}

/**
 * Calcula la posición local 3D de un cuerpo basándose en su órbita.
 * Simplificación: asume órbitas circulares en plano XY.
 * 
 * @param orbit - Parámetros orbitales (puede ser undefined)
 * @returns Posición 3D local relativa al centro de la órbita
 */
export function computePositionFromOrbit(orbit?: Orbit): Position3D {
  if (!orbit) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const r = orbit.semiMajorAxis;
  const angle = orbit.phaseAtEpoch;
  const x = r * Math.cos(angle);
  const y = r * Math.sin(angle);
  const z = 0; // simplificación: órbitas en plano XY
  
  return { x, y, z };
}

/**
 * Calcula la velocidad orbital instantánea de un cuerpo en órbita circular.
 * v = 2πr / T donde r es el radio orbital y T el periodo.
 * 
 * @param orbit - Parámetros orbitales
 * @returns Velocidad orbital en km/s
 */
export function computeOrbitalVelocity(orbit: Orbit): number {
  if (orbit.period <= 0) return 0;
  const circumference = 2 * Math.PI * orbit.semiMajorAxis;
  return circumference / orbit.period; // km/s
}

/**
 * Calcula el periodo orbital usando la tercera ley de Kepler simplificada.
 * T² = (4π² / GM) * a³
 * 
 * @param semiMajorAxisKm - Semieje mayor en kilómetros
 * @param centralBodyMassKg - Masa del cuerpo central en kg
 * @returns Periodo orbital en segundos
 */
export function computeOrbitalPeriod(semiMajorAxisKm: number, centralBodyMassKg: number): number {
  const G = 6.67430e-11; // constante gravitacional en m³/(kg·s²)
  const a = semiMajorAxisKm * 1000; // convertir a metros
  const T_squared = (4 * Math.PI * Math.PI * a * a * a) / (G * centralBodyMassKg);
  return Math.sqrt(T_squared);
}
