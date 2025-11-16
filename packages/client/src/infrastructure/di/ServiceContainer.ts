import SettingsService from "@client/application/SettingsService";
import I18nService from "@client/application/I18nService";
import ServerBrowserService from "@client/application/ServerBrowserService";
import WindowService from "@client/application/WindowService";
import TextureResolverService from "@client/application/TextureResolverService";
import JsonSettingsRepository from "@client/infrastructure/settings/JsonSettingsRepository";
import JsonTranslationProvider from "@client/infrastructure/i18n/JsonTranslationProvider";
import PersistentServerDirectory from "@client/infrastructure/server/PersistentServerDirectory";
import IpcStorage from "@client/infrastructure/storage/IpcStorage";
import { BrowserStorage } from "@client/infrastructure/storage/BrowserStorage";
import BrowserFileExistenceChecker from "@client/infrastructure/assets/BrowserFileExistenceChecker";
import { FpsCounter } from "@client/infrastructure/ui/FpsCounter";
import ThreeRenderer from "@client/infrastructure/rendering/ThreeRenderer";
import type { Services } from "../ui/hooks/useServices";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import SceneManager from "@client/application/SceneManager";
import GameScreenManager from "@client/application/ui/GameScreenManager";

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
  build(): Services {
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
    
    // File system utilities
    const fileChecker = new BrowserFileExistenceChecker();
    
    // Asset services
    const textureResolver = new TextureResolverService(settingsService, fileChecker);

    // Debug utilities
    const fpsCounter = new FpsCounter();

    // Rendering engine
    const renderingEngine = new ThreeRenderer(fpsCounter);

    // Screen and Scene Managers
    const root = document.getElementById('app-root') || document.body; // Use app root or fallback to body
    const screenRouter = new ScreenRouter(root);
    const sceneManager = new SceneManager(renderingEngine, settingsService);
    const gameScreenManager = new GameScreenManager(screenRouter, sceneManager);

    this.services = {
      settings: settingsService,
      i18n: i18nService,
      serverBrowser: serverBrowser,
      window: windowService,
      textureResolver: textureResolver,
      fpsCounter: fpsCounter,
      renderingEngine: renderingEngine,
      navigation: gameScreenManager,
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
