import UiLayer from "./UiLayer";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import GameScreenManager from "@client/application/ui/GameScreenManager";
import { GameScreens } from "@client/domain/ui/GameScreenRegistry";
import MainScreen from "./screens/MainScreen";
import SandboxScreen from "./screens/SandboxScreen";
import type { Services } from "./hooks/useServices";
import type SceneManager from "@client/application/SceneManager";
import EcsDemoScreen from "./screens/EcsDemoScreen";

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
    (services as any).navigation = this.gameScreenManager;

    // Initialize root app with transition overlay
    this.uiLayer.initializeRootApp(this.gameScreenManager);

    // Create screens (no need to pass navigate callback anymore)
    const mainScreen = new MainScreen();
    (mainScreen as any).services = services;

    const sandboxScreen = new SandboxScreen();
    (sandboxScreen as any).services = services;
    
    const ecsDemoScreen = new EcsDemoScreen();
    (ecsDemoScreen as any).services = services;

    // Register screens with router
    this.router.register(mainScreen);
    this.router.register(sandboxScreen);
    this.router.register(ecsDemoScreen);
  }

  /**
   * Inject scene editor and object factory into services
   */
  injectEditorServices(services: Services, sceneEditor: any, objectFactory: any): void {
    (services as any).sceneEditor = sceneEditor;
    (services as any).objectFactory = objectFactory;
  }

  /**
   * Show initial screen with transition
   */
  async showInitialScreen(): Promise<void> {
    // Navigate to main menu (UI + Scene together with fade transition)
    await this.gameScreenManager.navigateTo(GameScreens.MainMenu);
  }

  /**
   * Get screen router for external navigation
   */
  getRouter(): ScreenRouter {
    return this.router;
  }
}

export default UIBootstrap;
