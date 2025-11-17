import UiLayer from "./UiLayer";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import GameScreenManager from "@client/application/ui/GameScreenManager";
import { GameScreens } from "@client/domain/ui/GameScreenRegistry";
import MainScreen from "./screens/MainScreen";
import SandboxScreen from "./screens/SandboxScreen";
import type SceneManager from "@client/application/SceneManager";
import EcsDemoScreen from "./screens/EcsDemoScreen";
import { h, render } from 'preact';
import DevRegistry from '@client/infrastructure/ui/dev/DevRegistry';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import DevOverlay from '@client/infrastructure/ui/components/dev/DevOverlay';
import { FpsWidget } from '@client/infrastructure/ui/components/common/FpsWidget';
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

    // Initialize root app with transition overlay
    this.uiLayer.initializeRootApp(this.gameScreenManager);

    // If in development, mount DevOverlay and register default widgets
    try {
      if (process.env.NODE_ENV !== 'production') {
        // create overlay container inside the UI root
        const root = this.uiLayer.getRoot();
        const overlayContainer = document.createElement('div');
        overlayContainer.className = 'dev-overlay-container';
        root.appendChild(overlayContainer);

        // Use services-provided registry/controller (created by ServiceContainer)
        const devRegistry = services.devRegistry;
        const fpsController = services.fpsController;

        // Render the overlay into the container
        try {
          render(h(DevOverlay, { registry: devRegistry }), overlayContainer);
        } catch (e) {
          // ignore overlay render errors in non-browser or test envs
          console.warn('DevOverlay render failed', e);
        }

        // Register FPS widget using the registry - start/stop controller on mount/unmount
        devRegistry.register({
          id: 'fps',
          render: () => h(FpsWidget, { controller: fpsController }),
          mount: () => fpsController.start(),
          unmount: () => fpsController.stop(),
        });
      }
    } catch (e) {
      // ignore in environments without DOM
    }

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
  injectEditorServices(services: Services, sceneEditor: any, objectFactory: any): void {
    (services as any).sceneEditor = sceneEditor;
    (services as any).objectFactory = objectFactory;
  }

  /**
   * Show initial screen with transition
   */
  async showInitialScreen(): Promise<void> {
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
