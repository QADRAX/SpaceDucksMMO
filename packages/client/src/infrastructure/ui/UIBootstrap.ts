import UiLayer from "./UiLayer";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import GameScreenManager from "@client/application/ui/GameScreenManager";
import { GameScreens } from "@client/domain/ui/GameScreenRegistry";
import MainScreen from "./screens/MainScreen";
import SandboxScreen from "./screens/SandboxScreen";
import type SceneManager from "@client/application/SceneManager";
import EcsDemoScreen from "./screens/EcsDemoScreen";
import type { Services } from "../di/Services";

/**
 * UI Bootstrap
 * Responsible for initializing the UI layer, screen router,
 * game screen manager, and registering all screens with proper dependency injection
 */
export class UIBootstrap {
  private uiLayer: UiLayer;
  private router: ScreenRouter;
  private gameScreenManager: GameScreenManager;

  constructor(root: HTMLElement) {
    this.uiLayer = new UiLayer(root);
    this.uiLayer.mount();
    this.router = new ScreenRouter(this.uiLayer.getRoot());
    // GameScreenManager will be initialized in registerScreens
    this.gameScreenManager = null as any; // Temporary
  }

  /**
   * Register screens and inject services
   */
  registerScreens(services: Services, sceneManager: SceneManager): void {
    // Initialize GameScreenManager and add to services
    this.gameScreenManager = new GameScreenManager(this.router, sceneManager);
    
    // Inject navigation service into services bundle
    services.navigation = this.gameScreenManager;
    // Expose sceneManager on services so UI tools can access scene APIs (inspector)
    services.sceneManager = sceneManager;

    // Initialize root app with transition overlay
    this.uiLayer.initializeRootApp(this.gameScreenManager);

    // Dev tooling is initialized separately (DevToolsBootstrap). UIBootstrap
    // should only be responsible for UI screens and navigation.

    const mainScreen = new MainScreen();
    mainScreen.setServices(services);

    const sandboxScreen = new SandboxScreen();
    sandboxScreen.setServices(services);
    
    const ecsDemoScreen = new EcsDemoScreen();
    ecsDemoScreen.setServices(services);

    // Register screens with router
    this.router.register(mainScreen);
    this.router.register(sandboxScreen);
    this.router.register(ecsDemoScreen);
  }

  /**
   * Inject scene editor and object factory into services
   */
  // Removed injectEditorServices: editor helpers should be accessed via sceneManager

  /**
   * Show initial screen with transition
   */
  async showInitialScreen(): Promise<void> {
    // In development start in Sandbox for faster iteration. Use import.meta.env.DEV when available.
    let isDev = false;
    try {
      isDev = !!((import.meta as any).env?.DEV);
    } catch (e) {}
    if (!isDev && typeof process !== 'undefined' && process.env) {
      isDev = process.env.NODE_ENV === 'development';
    }

    await this.gameScreenManager.navigateTo(isDev ? GameScreens.Sandbox : GameScreens.MainMenu);
  }

  /**
   * Get screen router for external navigation
   */
  getRouter(): ScreenRouter {
    return this.router;
  }
}

export default UIBootstrap;
