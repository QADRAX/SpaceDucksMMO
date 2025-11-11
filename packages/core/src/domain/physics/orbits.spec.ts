import { 
  advanceOrbit, 
  computePositionFromOrbit, 
  computeOrbitalVelocity,
  computeOrbitalPeriod 
} from '@domain/physics/orbits';
import { 
  SOLAR_MASS_KG, 
  EARTH_MASS_KG, 
  LUNAR_MASS_KG,
  ASTRONOMICAL_UNIT_KM,
  SIDEREAL_YEAR_SECONDS,
  LUNAR_SIDEREAL_MONTH_SECONDS
} from '@domain/physics/constants';
import type { Planet } from '@domain/map/planet';
import { PlanetClass } from '@domain/map/planet';
import type { Orbit } from '@domain/map/orbit';

describe('orbits', () => {
  describe('advanceOrbit', () => {
    it('should advance orbital phase by correct delta for given time', () => {
      const planet: Planet = {
        id: 'test-planet',
        name: 'Test Planet',
        class: PlanetClass.Rocky,
        massKg: EARTH_MASS_KG,
        radiusM: 6_371_000,
        gravity: 9.8,
        hasAtmosphere: false,
        orbit: {
          centerId: 'star-1',
          semiMajorAxis: ASTRONOMICAL_UNIT_KM,
          eccentricity: 0,
          inclination: 0,
          period: SIDEREAL_YEAR_SECONDS,
          phaseAtEpoch: 0,
        },
      };

      // Avanzar medio año (π radianes)
      const halfYear = SIDEREAL_YEAR_SECONDS / 2;
      advanceOrbit(planet, halfYear);

      expect(planet.orbit!.phaseAtEpoch).toBeCloseTo(Math.PI, 5);
    });

    it('should wrap phase around 2π', () => {
      const planet: Planet = {
        id: 'test-planet',
        name: 'Test Planet',
        class: PlanetClass.Rocky,
        massKg: EARTH_MASS_KG,
        radiusM: 6_371_000,
        gravity: 9.8,
        hasAtmosphere: false,
        orbit: {
          centerId: 'star-1',
          semiMajorAxis: ASTRONOMICAL_UNIT_KM,
          eccentricity: 0,
          inclination: 0,
          period: 100, // periodo corto para testing
          phaseAtEpoch: 0,
        },
      };

      // Avanzar 1.5 periodos (3π radianes → debería ser π después del wrap)
      advanceOrbit(planet, 150);

      expect(planet.orbit!.phaseAtEpoch).toBeCloseTo(Math.PI, 5);
    });

    it('should recursively advance moon orbits', () => {
      const moon: Planet = {
        id: 'test-moon',
        name: 'Test Moon',
        class: PlanetClass.Rocky,
        massKg: LUNAR_MASS_KG,
        radiusM: 1_737_000,
        gravity: 1.6,
        hasAtmosphere: false,
        orbit: {
          centerId: 'test-planet',
          semiMajorAxis: 384_400,
          eccentricity: 0,
          inclination: 0,
          period: LUNAR_SIDEREAL_MONTH_SECONDS,
          phaseAtEpoch: 0,
        },
      };

      const planet: Planet = {
        id: 'test-planet',
        name: 'Test Planet',
        class: PlanetClass.Rocky,
        massKg: EARTH_MASS_KG,
        radiusM: 6_371_000,
        gravity: 9.8,
        hasAtmosphere: false,
        orbit: {
          centerId: 'star-1',
          semiMajorAxis: ASTRONOMICAL_UNIT_KM,
          eccentricity: 0,
          inclination: 0,
          period: SIDEREAL_YEAR_SECONDS,
          phaseAtEpoch: 0,
        },
        moons: [moon],
      };

      // Avanzar medio periodo lunar
      const halfMoonPeriod = LUNAR_SIDEREAL_MONTH_SECONDS / 2;
      advanceOrbit(planet, halfMoonPeriod);

      expect(moon.orbit!.phaseAtEpoch).toBeCloseTo(Math.PI, 5);
    });

    it('should handle planet without orbit gracefully', () => {
      const planet: Planet = {
        id: 'test-planet',
        name: 'Test Planet',
        class: PlanetClass.Rocky,
        massKg: EARTH_MASS_KG,
        radiusM: 6_371_000,
        gravity: 9.8,
        hasAtmosphere: false,
      };

      expect(() => advanceOrbit(planet, 1000)).not.toThrow();
    });
  });

  describe('computePositionFromOrbit', () => {
    it('should return origin for undefined orbit', () => {
      const pos = computePositionFromOrbit(undefined);
      expect(pos).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should compute correct position at phase 0 (x-axis)', () => {
      const orbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100,
        eccentricity: 0,
        inclination: 0,
        period: 100,
        phaseAtEpoch: 0,
      };

      const pos = computePositionFromOrbit(orbit);
      
      expect(pos.x).toBeCloseTo(100, 5);
      expect(pos.y).toBeCloseTo(0, 5);
      expect(pos.z).toBe(0);
    });

    it('should compute correct position at phase π/2 (y-axis)', () => {
      const orbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100,
        eccentricity: 0,
        inclination: 0,
        period: 100,
        phaseAtEpoch: Math.PI / 2,
      };

      const pos = computePositionFromOrbit(orbit);
      
      expect(pos.x).toBeCloseTo(0, 5);
      expect(pos.y).toBeCloseTo(100, 5);
      expect(pos.z).toBe(0);
    });

    it('should compute correct position at phase π (negative x-axis)', () => {
      const orbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100,
        eccentricity: 0,
        inclination: 0,
        period: 100,
        phaseAtEpoch: Math.PI,
      };

      const pos = computePositionFromOrbit(orbit);
      
      expect(pos.x).toBeCloseTo(-100, 5);
      expect(pos.y).toBeCloseTo(0, 5);
      expect(pos.z).toBe(0);
    });
  });

  describe('computeOrbitalVelocity', () => {
    it('should compute correct velocity for circular orbit', () => {
      const orbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100, // km
        eccentricity: 0,
        inclination: 0,
        period: 100, // segundos
        phaseAtEpoch: 0,
      };

      // Para órbita circular pequeña, usar masa similar
      const centralMass = 1e20; // masa arbitraria
      const velocity = computeOrbitalVelocity(orbit, centralMass);
      
      // Verificar que la velocidad es razonable y finita
      expect(velocity).toBeGreaterThan(0);
      expect(Number.isFinite(velocity)).toBe(true);
    });

    it('should return 0 for invalid period', () => {
      const orbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100,
        eccentricity: 0,
        inclination: 0,
        period: 0,
        phaseAtEpoch: 0,
      };

      const velocity = computeOrbitalVelocity(orbit, SOLAR_MASS_KG);
      expect(velocity).toBe(0);
    });

    it('should compute Earth orbital velocity approximately', () => {
      const orbit: Orbit = {
        centerId: 'sun',
        semiMajorAxis: ASTRONOMICAL_UNIT_KM,
        eccentricity: 0.0167, // excentricidad real de la Tierra
        inclination: 0,
        period: SIDEREAL_YEAR_SECONDS,
        phaseAtEpoch: 0, // en perihelio
      };

      const velocity = computeOrbitalVelocity(orbit, SOLAR_MASS_KG);
      
      // La velocidad orbital de la Tierra varía entre ~29.3 km/s (afelio) y ~30.3 km/s (perihelio)
      // En perihelio (phaseAtEpoch=0) debería estar cerca de 30.3 km/s
      expect(velocity).toBeGreaterThan(29);
      expect(velocity).toBeLessThan(31);
    });
  });

  describe('computeOrbitalPeriod', () => {
    it('should compute correct period using Kepler third law (Earth-Sun)', () => {
      // Sistema Tierra-Sol con constantes precisas
      const period = computeOrbitalPeriod(ASTRONOMICAL_UNIT_KM, SOLAR_MASS_KG, EARTH_MASS_KG);
      
      // Año sideral preciso: 365.256363004 días = 31,558,149.7635 segundos
      // Resultado: 31,558,226.957 segundos
      // Diferencia: 77 segundos en ~31.5M segundos = 99.9997% de precisión
      // La diferencia se debe a que asumimos órbita circular (e=0) cuando la Tierra tiene e=0.0167
      expect(period).toBeCloseTo(SIDEREAL_YEAR_SECONDS, -3);
    });

    it('should compute Moon orbital period around Earth', () => {
      const semiMajorAxisKm = 384_400; // distancia Tierra-Luna
      
      const period = computeOrbitalPeriod(semiMajorAxisKm, EARTH_MASS_KG, LUNAR_MASS_KG);
      
      // Mes sideral lunar preciso: 27.321661 días = 2,360,591.5 segundos
      // Resultado: 2,357,397 segundos
      // Diferencia: ~3200 segundos = 99.86% de precisión
      // La diferencia se debe a órbita elíptica real (e=0.0549) y perturbaciones solares
      expect(period).toBeCloseTo(LUNAR_SIDEREAL_MONTH_SECONDS, -4);
    });

    it('should work without orbiting body mass (backward compatibility)', () => {
      const period = computeOrbitalPeriod(ASTRONOMICAL_UNIT_KM, SOLAR_MASS_KG);
      
      // Sin masa de la Tierra, ligeramente menos preciso pero aún cercano
      expect(period).toBeCloseTo(SIDEREAL_YEAR_SECONDS, -3);
    });

    it('should handle very small orbits', () => {
      const semiMajorAxisKm = 1000; // órbita muy baja
      const massKg = EARTH_MASS_KG;

      const period = computeOrbitalPeriod(semiMajorAxisKm, massKg);
      
      expect(period).toBeGreaterThan(0);
      expect(Number.isFinite(period)).toBe(true);
    });
  });

  describe('Elliptical Orbits', () => {
    it('should compute correct position for Earth elliptical orbit at perihelion', () => {
      const orbit: Orbit = {
        centerId: 'sun',
        semiMajorAxis: ASTRONOMICAL_UNIT_KM,
        eccentricity: 0.0167, // excentricidad real de la Tierra
        inclination: 0,
        period: SIDEREAL_YEAR_SECONDS,
        phaseAtEpoch: 0, // anomalía media = 0 → cerca del perihelio
      };

      const pos = computePositionFromOrbit(orbit);
      
      // En perihelio, distancia mínima = a(1-e) ≈ 147.1 millones de km
      const distanceFromSun = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      const expectedPerihelion = ASTRONOMICAL_UNIT_KM * (1 - 0.0167);
      
      expect(distanceFromSun).toBeCloseTo(expectedPerihelion, -3);
    });

    it('should compute correct position for Earth elliptical orbit at aphelion', () => {
      const orbit: Orbit = {
        centerId: 'sun',
        semiMajorAxis: ASTRONOMICAL_UNIT_KM,
        eccentricity: 0.0167,
        inclination: 0,
        period: SIDEREAL_YEAR_SECONDS,
        phaseAtEpoch: Math.PI, // anomalía media = π → cerca del afelio
      };

      const pos = computePositionFromOrbit(orbit);
      
      // En afelio, distancia máxima = a(1+e) ≈ 152.1 millones de km
      const distanceFromSun = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      const expectedAphelion = ASTRONOMICAL_UNIT_KM * (1 + 0.0167);
      
      expect(distanceFromSun).toBeCloseTo(expectedAphelion, -3);
    });

    it('should compute correct position for highly eccentric orbit (Halley comet)', () => {
      const orbit: Orbit = {
        centerId: 'sun',
        semiMajorAxis: 2_667_950_000, // ~17.8 AU en km
        eccentricity: 0.967, // órbita muy excéntrica
        inclination: 0,
        period: 2_372_112_000, // ~75 años en segundos
        phaseAtEpoch: 0, // perihelio
      };

      const posPerihelion = computePositionFromOrbit(orbit);
      const distancePerihelion = Math.sqrt(
        posPerihelion.x * posPerihelion.x + posPerihelion.y * posPerihelion.y
      );
      
      // Perihelio de Halley: ~0.586 AU ≈ 87.7 millones de km
      const expectedPerihelion = 2_667_950_000 * (1 - 0.967);
      expect(distancePerihelion).toBeCloseTo(expectedPerihelion, -5);
      
      // Verificar afelio
      orbit.phaseAtEpoch = Math.PI;
      const posAphelion = computePositionFromOrbit(orbit);
      const distanceAphelion = Math.sqrt(
        posAphelion.x * posAphelion.x + posAphelion.y * posAphelion.y
      );
      
      // Afelio de Halley: ~35.1 AU ≈ 5,248 millones de km
      const expectedAphelion = 2_667_950_000 * (1 + 0.967);
      expect(distanceAphelion).toBeCloseTo(expectedAphelion, -5);
    });

    it('should compute faster velocity at perihelion than aphelion', () => {
      const orbitPerihelion: Orbit = {
        centerId: 'sun',
        semiMajorAxis: ASTRONOMICAL_UNIT_KM,
        eccentricity: 0.0167,
        inclination: 0,
        period: SIDEREAL_YEAR_SECONDS,
        phaseAtEpoch: 0, // perihelio
      };

      const orbitAphelion: Orbit = {
        ...orbitPerihelion,
        phaseAtEpoch: Math.PI, // afelio
      };

      const velocityPerihelion = computeOrbitalVelocity(orbitPerihelion, SOLAR_MASS_KG);
      const velocityAphelion = computeOrbitalVelocity(orbitAphelion, SOLAR_MASS_KG);
      
      // Segunda ley de Kepler: velocidad mayor en perihelio
      expect(velocityPerihelion).toBeGreaterThan(velocityAphelion);
      
      // Valores aproximados para la Tierra:
      // Perihelio: ~30.3 km/s, Afelio: ~29.3 km/s
      expect(velocityPerihelion).toBeCloseTo(30.3, 0);
      expect(velocityAphelion).toBeCloseTo(29.3, 0);
    });

    it('should reduce to circular orbit when eccentricity is zero', () => {
      const circularOrbit: Orbit = {
        centerId: 'star-1',
        semiMajorAxis: 100_000,
        eccentricity: 0, // circular
        inclination: 0,
        period: 100_000,
        phaseAtEpoch: 0,
      };

      const ellipticalOrbit: Orbit = {
        ...circularOrbit,
        eccentricity: 0.0001, // casi circular
      };

      const posCircular = computePositionFromOrbit(circularOrbit);
      const posElliptical = computePositionFromOrbit(ellipticalOrbit);
      
      const distCircular = Math.sqrt(posCircular.x ** 2 + posCircular.y ** 2);
      const distElliptical = Math.sqrt(posElliptical.x ** 2 + posElliptical.y ** 2);
      
      // Distancias deben ser casi idénticas
      expect(distCircular).toBeCloseTo(distElliptical, -2);
      expect(distCircular).toBeCloseTo(100_000, -1);
  });
  });
});

