import type { Galaxy, Planet, Position3D } from '@spaceducks/core';
import type { ServerConfig } from '../../config/ServerConfig';
import type IGalaxyLoader from '../ports/IGalaxyLoader';

/**
 * GalaxyManager mantiene una galaxia en memoria y avanza su estado en tiempo real.
 * - Constructor limpio: solo almacena dependencias (config, loader).
 * - initialize() async: carga la galaxia desde el loader inyectado.
 * - tick(): avanza las fases orbitales de planetas y lunas según dt (ms).
 */
export class GalaxyManager {
  public galaxy!: Galaxy;
  private config: ServerConfig;
  private loader: IGalaxyLoader;

  constructor(config: ServerConfig, loader: IGalaxyLoader) {
    this.config = config;
    this.loader = loader;
  }

  /** Carga la galaxia desde el loader inyectado; lanza en caso de error */
  public async initialize(): Promise<void> {
    const cfgPath = this.config.galaxyConfigPath;
    try {
      this.galaxy = await this.loader.load(cfgPath);
      console.log(`[GalaxyManager] ✓ Galaxia cargada desde: ${cfgPath}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`[GalaxyManager] Error al inicializar galaxia desde ${cfgPath}: ${msg}`);
    }
  }

  /** Avanza la simulación de la galaxia en dt milisegundos */
  public tick(dtMs: number) {
    const dtSec = dtMs / 1000;
    for (const sysId of Object.keys(this.galaxy.systems)) {
      const sys = this.galaxy.systems[sysId];
      for (const pId of Object.keys(sys.planets)) {
        const planet = sys.planets[pId];
        this.advancePlanetOrbit(planet, dtSec);
      }
    }
  }

  private advancePlanetOrbit(planet: Planet, dtSec: number) {
    if (planet.orbit && (planet.orbit as any).period > 0) {
      const orbit = planet.orbit as any;
      const delta = (2 * Math.PI * dtSec) / orbit.period;
      orbit.phaseAtEpoch = (orbit.phaseAtEpoch + delta) % (2 * Math.PI);
    }
    if (planet.moons) {
      for (const moon of planet.moons) {
        if (moon.orbit && (moon.orbit as any).period > 0) {
          const delta = (2 * Math.PI * dtSec) / (moon.orbit as any).period;
          (moon.orbit as any).phaseAtEpoch = ((moon.orbit as any).phaseAtEpoch + delta) % (2 * Math.PI);
        }
      }
    }
  }

  /** Calcula posición local 3D aproximada de un planeta basada en su órbita (plano XY). */
  public static computeLocalPositionFromOrbit(orbit?: any): Position3D {
    if (!orbit) return { x: 0, y: 0, z: 0 };
    const r = orbit.semiMajorAxis;
    const angle = orbit.phaseAtEpoch;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0;
    return { x, y, z };
  }
}

export default GalaxyManager;
