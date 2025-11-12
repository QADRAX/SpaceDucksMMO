import UiLayer from "./UiLayer";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import ScreenId from "@client/domain/ui/ScreenId";
import MainScreen from "./screens/MainScreen";
import type { Services } from "./hooks/useServices";
import type SceneManager from "@client/application/SceneManager";
import SceneId from "@client/domain/scene/SceneId";

/**
 * UI Bootstrap
 * Responsible for initializing the UI layer, screen router,
 * and registering all screens with proper dependency injection
 */
export class UIBootstrap {
  private uiLayer: UiLayer;
  private router: ScreenRouter;

  constructor(root: HTMLElement) {
    this.uiLayer = new UiLayer(root);
    this.uiLayer.mount();
    this.router = new ScreenRouter(this.uiLayer.getRoot());
  }

  /**
   * Register screens and inject services
   */
  registerScreens(services: Services, sceneManager: SceneManager): void {
    // Create main screen with scene switching logic
    const mainScreen = new MainScreen((id) => {
      this.router.show(id);
      if (id === ScreenId.Main) {
        sceneManager.switchTo(SceneId.MainMenu);
      }
    });

    // Inject services via property (Clean DI pattern)
    (mainScreen as any).services = services;

    // Register with router
    this.router.register(mainScreen);
  }

  /**
   * Show initial screen
   */
  showInitialScreen(): void {
    this.router.show(ScreenId.Main);
  }

  /**
   * Get screen router for external navigation
   */
  getRouter(): ScreenRouter {
    return this.router;
  }
}

export default UIBootstrap;
