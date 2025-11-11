import { ServerConfig } from "@config/ServerConfig";
import { GalaxyManager } from "@app/galaxy/GalaxyManager";
import type IGalaxyLoader from "@app/ports/IGalaxyLoader";
import { YamlGalaxyLoader } from "@infra/galaxy/YamlGalaxyLoader";

/**
 * Contenedor simple de inyección de dependencias (IoC).
 * Gestiona la creación y ciclo de vida de servicios principales.
 *
 * Uso:
 *   const container = new Container();
 *   await container.initialize();
 *   const config = container.getServerConfig();
 *   const galaxyManager = container.getGalaxyManager();
 */
export class Container {
  private serverConfig?: ServerConfig;
  private galaxyManager?: GalaxyManager;

  /**
   * Inicializa el contenedor: crea todas las dependencias.
   * Debe llamarse una sola vez al startup de la app.
   */
  public async initialize(): Promise<void> {
    console.log("[Container] Inicializando dependencias...");

    // 1. Crear ServerConfig (síncrono)
    this.serverConfig = new ServerConfig();
    console.log(`[Container] ✓ ServerConfig creado: ${this.serverConfig}`);

    // 2. Crear loader de galaxia (infra) e inyectarlo en GalaxyManager
    const loader: IGalaxyLoader = new YamlGalaxyLoader();
    this.galaxyManager = new GalaxyManager(this.serverConfig, loader);
    console.log(
      "[Container] ✓ GalaxyManager instanciado (loader inyectado, sin cargar galaxia aún)"
    );

    // 3. Inicializar GalaxyManager (async: cargar galaxia). Si falla, se propagará.
    await this.galaxyManager.initialize();
    console.log("[Container] ✓ GalaxyManager inicializado (galaxia cargada)");

    console.log("[Container] ✓ Todas las dependencias listas");
  }

  /**
   * Obtiene la instancia de ServerConfig.
   * Lanza error si no se ha llamado a initialize() primero.
   */
  public getServerConfig(): ServerConfig {
    if (!this.serverConfig) {
      throw new Error(
        "[Container] ServerConfig no inicializado. Llama a initialize() primero."
      );
    }
    return this.serverConfig;
  }

  /**
   * Obtiene la instancia de GalaxyManager.
   * Lanza error si no se ha llamado a initialize() primero.
   */
  public getGalaxyManager(): GalaxyManager {
    if (!this.galaxyManager) {
      throw new Error(
        "[Container] GalaxyManager no inicializado. Llama a initialize() primero."
      );
    }
    return this.galaxyManager;
  }
}

export default Container;
