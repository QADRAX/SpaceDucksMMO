import type { Galaxy, Planet } from '@spaceducks/core';
import { advanceOrbit, computePositionFromOrbit } from '@spaceducks/core';
import type { ServerConfig } from '../../config/ServerConfig';
import type IGalaxyLoader from '../ports/IGalaxyLoader';

/**
 * GalaxyManager mantiene una galaxia en memoria y avanza su estado en tiempo real.
 * - Constructor limpio: solo almacena dependencias (config, loader).
 * - initialize() async: carga la galaxia desde el loader inyectado.
 * - tick(): avanza las fases orbitales usando funciones puras del dominio.
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
        advanceOrbit(planet, dtSec);
      }
    }
  }

  /**
   * Helper estático para calcular posición desde órbita.
   * Delega a la función pura del dominio.
   */
  public static computeLocalPositionFromOrbit = computePositionFromOrbit;
}

export default GalaxyManager;
