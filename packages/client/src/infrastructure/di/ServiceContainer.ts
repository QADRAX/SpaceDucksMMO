import SettingsService from "@client/application/SettingsService";
import I18nService from "@client/application/I18nService";
import ServerBrowserService from "@client/application/ServerBrowserService";
import WindowService from "@client/application/WindowService";
import TextureResolverService from "@client/application/TextureResolverService";
import TextureCatalogIpcService from "@client/application/TextureCatalogIpcService";
import JsonSettingsRepository from "@client/infrastructure/settings/JsonSettingsRepository";
import JsonTranslationProvider from "@client/infrastructure/i18n/JsonTranslationProvider";
import PersistentServerDirectory from "@client/infrastructure/server/PersistentServerDirectory";
import IpcStorage from "@client/infrastructure/storage/IpcStorage";
import { BrowserStorage } from "@client/infrastructure/storage/BrowserStorage";
import BrowserFileExistenceChecker from "@client/infrastructure/assets/BrowserFileExistenceChecker";
import DevRegistry from '@client/infrastructure/ui/dev/DevRegistry';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import KeyboardInputService from '@client/application/KeyboardInputService';
import type { Services} from "./Services";
import DefaultEcsComponentFactory from '@client/domain/ecs/core/ComponentFactory';

/**
 * Service Container - Composition Root for Dependency Injection
 * Responsible for creating and wiring all application services
 * following Clean Architecture principles
 */
export class ServiceContainer {
  private services!: Services;

  /**
   * Build and wire all services
   */
  build(texturePaths?: string[]): Services {
    // Storage adapters
    const storage = this.createStorage();
    const serverStorage = new IpcStorage();

    // Repositories (domain ports implemented by infrastructure)
    const settingsRepo = new JsonSettingsRepository(storage);
    const serverDirectory = new PersistentServerDirectory(serverStorage);

    // Translation provider
    const translationProvider = new JsonTranslationProvider();

    // Application services
    const settingsService = new SettingsService(settingsRepo);
    const i18nService = new I18nService(translationProvider, settingsRepo);
    const serverBrowser = new ServerBrowserService(serverDirectory);
    const windowService = new WindowService();
    
    // File system utilities (kept for potential future use)
    const fileChecker = new BrowserFileExistenceChecker();

    // Texture catalog: use IPC-backed service that fetches from main process.
    const textureCatalog = new TextureCatalogIpcService();

    // Asset services
    // TextureResolverService now depends on SettingsService + TextureCatalogService
    const textureResolver = new TextureResolverService(settingsService, textureCatalog);

    // Debug utilities
    const fpsController = new FpsController();
    const devRegistry = new DevRegistry();
    const keyboard = new KeyboardInputService();
    this.services = {
      settings: settingsService,
      i18n: i18nService,
      serverBrowser: serverBrowser,
      window: windowService,
      textureResolver: textureResolver,
      textureCatalog: textureCatalog,
      fpsController: fpsController,
      devRegistry: devRegistry,
      keyboard: keyboard,
      // renderingEngine/navigation/sceneManager are provided later by RendererBootstrap
      ecsComponentFactory: new DefaultEcsComponentFactory(),
    };

    return this.services;
  }

  /**
   * Initialize all services asynchronously
   */
  async initialize(): Promise<void> {
    if (!this.services) {
      throw new Error("Services must be built before initialization");
    }

    await Promise.all([
      this.services.i18n.initialize(),
      this.services.settings.load(),
    ]);
  }

  /**
   * Get services bundle (must be built first)
   */
  getServices(): Services {
    if (!this.services) {
      throw new Error("Services not built yet. Call build() first.");
    }
    return this.services;
  }

  /**
   * Create appropriate storage adapter based on environment
   */
  private createStorage() {
    return (window as any).spaceducks?.storage
      ? new IpcStorage()
      : new BrowserStorage();
  }
}

export default ServiceContainer;
