import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { SceneService } from "@client/application/SceneService";
import SceneManager from "@client/application/SceneManager";
import SceneId from "@client/domain/scene/SceneId";
import GraphicsController from "../ui/GraphicsController";
import type { GameSettings } from "@client/domain/settings/GameSettings";
import type { TextureResolverService } from "@client/application/TextureResolverService";
import type { SettingsService } from "@client/application/SettingsService";
import { DemoEcsScene } from '@client/infrastructure/scenes/DemoEcsScene';
import { MainMenuScene } from '@client/infrastructure/scenes/MainMenuScene';
import { SandboxScene } from '@client/infrastructure/scenes/SandboxScene';

/**
 * Rendering Bootstrap
 * Responsible for initializing the 3D rendering engine (Three.js),
 * scene management, graphics controller, and scene editor
 */
export class RenderingBootstrap {
  private engine: ThreeRenderer;
  private sceneManager: SceneManager;
  private sceneService: SceneService;
  private graphicsController: GraphicsController;

  constructor(
    private textureResolver: TextureResolverService,
    private settingsService: SettingsService
  ) {
    this.engine = new ThreeRenderer();
    this.sceneManager = new SceneManager(this.engine, this.settingsService);
    this.sceneService = new SceneService(this.engine, this.sceneManager);
    this.graphicsController = new GraphicsController(this.engine);
  }

  /**
   * Initialize rendering engine and register scenes
   */
  initialize(container: HTMLElement): void {
    // Register scenes as class instances (migrating away from definition-based SceneFactory)
    this.sceneManager.register(new MainMenuScene(this.settingsService));
    this.sceneManager.register(new SandboxScene(this.settingsService));
    // Register ECS demo scene (POC)
    this.sceneManager.register(new DemoEcsScene(this.settingsService));
    
    // Initialize Three.js renderer, camera, scene
    this.sceneService.init(container);

    // Switch to initial scene
    this.sceneManager.switchTo(SceneId.MainMenu);
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup keyboard shortcuts for debugging
   */
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (event) => {
      // F3 - Toggle FPS counter
      if (event.key === 'F3') {
        event.preventDefault();
        this.engine.toggleFpsCounter();
      }
    });
  }

  /**
   * Start the render loop
   */
  start(): void {
    this.sceneService.start();
  }

  /**
   * Apply graphics settings to the engine
   */
  applySettings(settings: GameSettings): void {
    this.graphicsController.setResolutionAuto();
    this.graphicsController.setAntialias(settings.graphics.antialias);
    this.graphicsController.setShadows(settings.graphics.shadows);
  }

  /**
   * Get graphics controller for runtime settings updates
   */
  getGraphicsController(): GraphicsController {
    return this.graphicsController;
  }

  /**
   * Get scene manager for UI-driven scene transitions
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }
}

export default RenderingBootstrap;
