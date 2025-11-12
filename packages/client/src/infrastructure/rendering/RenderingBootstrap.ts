import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { SceneService } from "@client/application/SceneService";
import SceneManager from "@client/application/SceneManager";
import MainMenuScene from "@client/infrastructure/scenes/MainMenuScene";
import GameWorldScene from "@client/infrastructure/scenes/GameWorldScene";
import SceneId from "@client/domain/scene/SceneId";
import GraphicsController from "../ui/GraphicsController";
import type { GameSettings } from "@client/domain/settings/GameSettings";
import type { TextureResolverService } from "@client/application/TextureResolverService";

/**
 * Rendering Bootstrap
 * Responsible for initializing the 3D rendering engine (Three.js),
 * scene management, and graphics controller
 */
export class RenderingBootstrap {
  private engine: ThreeRenderer;
  private sceneManager: SceneManager;
  private sceneService: SceneService;
  private graphicsController: GraphicsController;

  constructor(private textureResolver: TextureResolverService) {
    this.engine = new ThreeRenderer();
    this.sceneManager = new SceneManager(this.engine);
    this.sceneService = new SceneService(this.engine, this.sceneManager);
    this.graphicsController = new GraphicsController(this.engine);
  }

  /**
   * Initialize rendering engine and register scenes
   */
  initialize(container: HTMLElement): void {
    // Register available 3D scenes
    this.sceneManager.register(new MainMenuScene(this.textureResolver));
    this.sceneManager.register(new GameWorldScene());

    // Initialize Three.js renderer, camera, scene
    this.sceneService.init(container);

    // Switch to initial scene
    this.sceneManager.switchTo(SceneId.MainMenu);
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
