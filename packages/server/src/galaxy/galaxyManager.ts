import fs from 'fs';
import yaml from 'js-yaml';
import type {
  Galaxy,
  Planet,
  Position3D,
} from '@spaceducks/core';
import type { ServerConfig } from '../config/ServerConfig';

/**
 * GalaxyManager mantiene una galaxia en memoria y avanza su estado en tiempo real.
 * - Constructor limpio: solo almacena config.
 * - initialize() async: carga la galaxia desde YAML o genera una por defecto.
 * - tick(): avanza las fases orbitales de planetas y lunas según dt (ms).
 */
export class GalaxyManager {
  public galaxy!: Galaxy;
  private config: ServerConfig;

  /**
   * Constructor: inyecta ServerConfig, pero NO carga la galaxia.
   * Llama a initialize() después de crear la instancia.
   */
  constructor(config: ServerConfig) {
    this.config = config;
  }

  /**
   * Método async para inicializar la galaxia.
   * Intenta cargar desde YAML; si falla, genera galaxia por defecto.
   */
  public async initialize(): Promise<void> {
    const cfgPath = this.config.galaxyConfigPath;
    try {
      if (!fs.existsSync(cfgPath)) {
        throw new Error(`Archivo de configuración de galaxia no encontrado en: ${cfgPath}`);
      }

      const text = fs.readFileSync(cfgPath, 'utf8');
      const doc = yaml.load(text);
      if (!doc || typeof doc !== 'object') {
        throw new Error(`Archivo YAML leído pero contenido inválido: ${cfgPath}`);
      }

      this.galaxy = doc as Galaxy;
      console.log(`[GalaxyManager] ✓ Galaxia cargada desde: ${cfgPath}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // No hacemos fallback a una galaxia por defecto: propagamos el error para que
      // el inicializador (Container / main) decida qué hacer.
      throw new Error(`[GalaxyManager] Error al inicializar galaxia desde ${cfgPath}: ${msg}`);
    }
  }

  /** Avanza la simulación de la galaxia en dt milisegundos */
  public tick(dtMs: number) {
    const dtSec = dtMs / 1000;
    // actualizar fases orbitales de todos los planetas y sus lunas
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

  /**
   * Calcula la posición local 3D aproximada de un planeta basada en su órbita (simple plano XY).
   * Devuelve Position3D relativa al sistema (no sumada a system.localPosition).
   */
  public static computeLocalPositionFromOrbit(orbit?: any): Position3D {
    if (!orbit) return { x: 0, y: 0, z: 0 };
    // Usamos semieje mayor en km; convertimos a unidades de 'kilómetros' en el espacio local
    const r = orbit.semiMajorAxis;
    const angle = orbit.phaseAtEpoch;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0; // simplificación: órbitas en plano
    return { x, y, z };
  }
}

export default GalaxyManager;
