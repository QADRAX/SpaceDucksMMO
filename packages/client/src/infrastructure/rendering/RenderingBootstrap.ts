import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { SceneService } from "@client/application/SceneService";
import SceneManager from "@client/application/SceneManager";
import SceneId from "@client/domain/scene/SceneId";
import GraphicsController from "../ui/GraphicsController";
import type { GameSettings } from "@client/domain/settings/GameSettings";
import type { TextureResolverService } from "@client/application/TextureResolverService";
import type { SettingsService } from "@client/application/SettingsService";
import { createMainMenuSceneDefinition, createSandboxSceneDefinition } from "@client/infrastructure/scenes/definitions";
import { SceneEditor } from "@client/application/SceneEditor";
import { ObjectFactory } from "@client/application/ObjectFactory";

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
  private sceneEditor: SceneEditor;
  private objectFactory: ObjectFactory;

  constructor(
    private textureResolver: TextureResolverService,
    private settingsService: SettingsService
  ) {
    this.engine = new ThreeRenderer();
    this.sceneManager = new SceneManager(this.engine, this.settingsService);
    this.sceneService = new SceneService(this.engine, this.sceneManager);
    this.graphicsController = new GraphicsController(this.engine);
    this.sceneEditor = new SceneEditor(this.engine);
    this.objectFactory = new ObjectFactory(this.textureResolver);
  }

  /**
   * Initialize rendering engine and register scenes
   */
  initialize(container: HTMLElement): void {
    // Register scenes using declarative definitions
    this.sceneManager.registerDefinition(createMainMenuSceneDefinition(this.textureResolver));
    this.sceneManager.registerDefinition(createSandboxSceneDefinition(this.textureResolver));
    
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

  /**
   * Get scene editor for runtime scene manipulation
   */
  getSceneEditor(): SceneEditor {
    return this.sceneEditor;
  }

  /**
   * Get object factory for creating scene objects
   */
  getObjectFactory(): ObjectFactory {
    return this.objectFactory;
  }
}

export default RenderingBootstrap;
