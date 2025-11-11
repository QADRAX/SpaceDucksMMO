import type { Planet } from '../map/planet';
import type { Position3D } from '../types/vector';
import type { Orbit } from '../map/orbit';
import { GRAVITATIONAL_CONSTANT } from './constants';

/**
 * Módulo de física orbital pura (sin side effects).
 * Funciones para calcular y avanzar órbitas de cuerpos celestes.
 * Soporta órbitas circulares y elípticas usando las leyes de Kepler.
 */

/**
 * Resuelve la ecuación de Kepler para órbitas elípticas: M = E - e·sin(E)
 * Usa el método de Newton-Raphson para encontrar la anomalía excéntrica (E).
 * 
 * @param meanAnomaly - Anomalía media M en radianes (phaseAtEpoch)
 * @param eccentricity - Excentricidad orbital e (0 = circular, <1 = elíptica)
 * @param tolerance - Tolerancia de convergencia (default: 1e-8)
 * @param maxIterations - Máximo de iteraciones (default: 15)
 * @returns Anomalía excéntrica E en radianes
 */
function solveKeplerEquation(
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-8,
  maxIterations: number = 15
): number {
  // Para órbitas circulares, E = M
  if (eccentricity < 1e-10) {
    return meanAnomaly;
  }

  // Normalizar anomalía media a [0, 2π]
  const M = meanAnomaly % (2 * Math.PI);
  
  // Estimación inicial: E₀ = M (buena aproximación para e pequeña)
  let E = M;
  
  // Newton-Raphson: E_{n+1} = E_n - f(E_n)/f'(E_n)
  // donde f(E) = E - e·sin(E) - M
  //       f'(E) = 1 - e·cos(E)
  for (let i = 0; i < maxIterations; i++) {
    const f = E - eccentricity * Math.sin(E) - M;
    const fPrime = 1 - eccentricity * Math.cos(E);
    
    const delta = f / fPrime;
    E = E - delta;
    
    if (Math.abs(delta) < tolerance) {
      return E;
    }
  }
  
  // Si no converge, retornar mejor estimación
  return E;
}

/**
 * Calcula la anomalía verdadera desde la anomalía excéntrica.
 * La anomalía verdadera (ν) es el ángulo real desde el periapsis.
 * 
 * @param eccentricAnomaly - Anomalía excéntrica E en radianes
 * @param eccentricity - Excentricidad orbital e
 * @returns Anomalía verdadera ν en radianes
 */
function computeTrueAnomaly(eccentricAnomaly: number, eccentricity: number): number {
  // Para órbitas circulares, ν = E = M
  if (eccentricity < 1e-10) {
    return eccentricAnomaly;
  }
  
  // Fórmula: tan(ν/2) = sqrt((1+e)/(1-e)) · tan(E/2)
  const sqrtFactor = Math.sqrt((1 + eccentricity) / (1 - eccentricity));
  const halfTrueAnomaly = Math.atan2(
    sqrtFactor * Math.sin(eccentricAnomaly / 2),
    Math.cos(eccentricAnomaly / 2)
  );
  
  return 2 * halfTrueAnomaly;
}

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
 * Calcula la posición local 3D de un cuerpo basándose en su órbita elíptica.
 * Usa las leyes de Kepler para calcular posición exacta considerando excentricidad.
 * 
 * Proceso:
 * 1. Resolver ecuación de Kepler para obtener anomalía excéntrica E
 * 2. Calcular anomalía verdadera ν desde E
 * 3. Calcular distancia radial r usando ecuación de órbita elíptica
 * 4. Convertir coordenadas polares (r, ν) a cartesianas (x, y)
 * 
 * @param orbit - Parámetros orbitales (puede ser undefined)
 * @returns Posición 3D local relativa al centro de la órbita (foco)
 */
export function computePositionFromOrbit(orbit?: Orbit): Position3D {
  if (!orbit) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const a = orbit.semiMajorAxis;
  const e = orbit.eccentricity;
  const M = orbit.phaseAtEpoch; // anomalía media
  
  // Resolver ecuación de Kepler: M = E - e·sin(E)
  const E = solveKeplerEquation(M, e);
  
  // Calcular anomalía verdadera ν
  const trueAnomaly = computeTrueAnomaly(E, e);
  
  // Calcular distancia radial usando ecuación de órbita elíptica
  // r = a(1 - e²) / (1 + e·cos(ν))
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
  
  // Convertir coordenadas polares a cartesianas
  // El centro de la órbita (foco) está en el origen
  const x = r * Math.cos(trueAnomaly);
  const y = r * Math.sin(trueAnomaly);
  const z = 0; // simplificación: órbitas en plano XY (sin inclinación)
  
  return { x, y, z };
}

/**
 * Calcula la velocidad orbital instantánea considerando órbitas elípticas.
 * Usa la ecuación vis-viva: v² = GM(2/r - 1/a)
 * 
 * Para órbitas circulares (e=0): v = sqrt(GM/r) = constante
 * Para órbitas elípticas (e>0): v varía según la distancia r
 * - Máxima en perihelio (punto más cercano)
 * - Mínima en afelio (punto más lejano)
 * 
 * @param orbit - Parámetros orbitales
 * @param centralBodyMassKg - Masa del cuerpo central en kg
 * @returns Velocidad orbital en km/s
 */
export function computeOrbitalVelocity(orbit: Orbit, centralBodyMassKg: number): number {
  if (orbit.period <= 0) return 0;
  
  const a = orbit.semiMajorAxis * 1000; // convertir a metros
  const e = orbit.eccentricity;
  const M = orbit.phaseAtEpoch;
  
  // Calcular posición actual para obtener distancia r
  const E = solveKeplerEquation(M, e);
  const trueAnomaly = computeTrueAnomaly(E, e);
  
  // Distancia radial en metros
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
  
  // Ecuación vis-viva: v² = GM(2/r - 1/a)
  const GM = GRAVITATIONAL_CONSTANT * centralBodyMassKg;
  const v_squared = GM * (2 / r - 1 / a);
  
  // Velocidad en m/s, convertir a km/s
  return Math.sqrt(v_squared) / 1000;
}

/**
 * Calcula el periodo orbital usando la tercera ley de Kepler.
 * T² = (4π² / G(M₁ + M₂)) * a³
 * 
 * Para mayor precisión, considera el sistema de dos cuerpos donde ambas masas
 * contribuyen a la gravedad mutua. Para sistemas donde M₁ >> M₂ (ej: Sol-Tierra),
 * el efecto es mínimo pero correcto.
 * 
 * @param semiMajorAxisKm - Semieje mayor en kilómetros
 * @param centralBodyMassKg - Masa del cuerpo central en kg (ej: Sol o planeta)
 * @param orbitingBodyMassKg - Masa del cuerpo orbitante en kg (opcional, default 0)
 * @returns Periodo orbital en segundos
 */
export function computeOrbitalPeriod(
  semiMajorAxisKm: number, 
  centralBodyMassKg: number,
  orbitingBodyMassKg: number = 0
): number {
  // Usar masa combinada para mayor precisión (problema de dos cuerpos)
  const totalMass = centralBodyMassKg + orbitingBodyMassKg;
  
  // Convertir a metros para usar con G en unidades SI
  const a_meters = semiMajorAxisKm * 1000;
  
  // T² = (4π² / G·M_total) * a³
  // Reorganizado para minimizar errores de redondeo:
  const coefficient = (4 * Math.PI * Math.PI) / (GRAVITATIONAL_CONSTANT * totalMass);
  const T_squared = coefficient * a_meters * a_meters * a_meters;
  
  return Math.sqrt(T_squared);
}
