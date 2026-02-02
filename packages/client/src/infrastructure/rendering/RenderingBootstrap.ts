import { ThreeRenderer, type IFpsController } from "@duckengine/rendering-three";
import EngineWithPhysics from "./EngineWithPhysics";
import { SceneService } from "@client/application/SceneService";
import SceneManager from "@client/application/SceneManager";
import SceneId from "@client/domain/scene/SceneId";
import GraphicsController from "../ui/GraphicsController";
import type { GameSettings } from "@client/domain/settings/GameSettings";
import type { SettingsService } from "@client/application/SettingsService";
import { DemoEcsScene } from '@client/infrastructure/scenes/DemoEcsScene';
import { MainMenuScene } from '@client/infrastructure/scenes/MainMenuScene';
import { SandboxScene } from '@client/infrastructure/scenes/SandboxScene';
import { SoccerFpsScene } from '@client/infrastructure/scenes/SoccerFpsScene';

/**
 * Rendering Bootstrap
 * Responsible for initializing the 3D rendering engine (Three.js),
 * scene management, graphics controller, and scene editor
 */
export class RenderingBootstrap {
  private engine: EngineWithPhysics;
  private sceneManager: SceneManager;
  private sceneService: SceneService;
  private graphicsController: GraphicsController;

  constructor(
    private settingsService: SettingsService,
    private fpsController: IFpsController // Add fpsController as a dependency
  ) {
    this.engine = new EngineWithPhysics(fpsController);
    this.sceneManager = new SceneManager(this.engine, this.settingsService);
    this.sceneService = new SceneService(this.engine, this.sceneManager);
    this.graphicsController = new GraphicsController(this.engine);
  }

  /**
   * Initialize rendering engine and register scenes
   */
  async initialize(container: HTMLElement): Promise<void> {
    // Ensure physics backend (Rapier) is initialized before any scene creates a physics system.
    await EngineWithPhysics.initPhysicsBackend();

    // Register scenes as class instances (migrating away from definition-based SceneFactory)
    this.sceneManager.register(new MainMenuScene(this.settingsService));
    this.sceneManager.register(new SandboxScene(this.settingsService));
    // Register ECS demo scene (POC)
    this.sceneManager.register(new DemoEcsScene(this.settingsService));
    // Register physics-based soccer prototype
    this.sceneManager.register(new SoccerFpsScene(this.settingsService));
    
    // Initialize Three.js renderer, camera, scene
    this.sceneService.init(container);

    // Switch to initial scene. In dev mode start directly in Sandbox for faster iteration.
    // Detect dev environment safely (Vite exposes `import.meta.env.DEV`, Node exposes `process.env.NODE_ENV`)
    let isDev = false;
    try {
      isDev = !!((import.meta as any).env?.DEV);
    } catch (e) {
      // ignore - import.meta may not be available in some environments
    }
    if (!isDev && typeof process !== 'undefined' && process.env) {
      isDev = process.env.NODE_ENV === 'development';
    }

    // SoccerFps is the current primary gameplay/prototype scene.
    // Keep MainMenu available for later UI navigation.
    const res = this.sceneManager.switchTo(SceneId.SoccerFps);
    if (!res.ok) {
      console.warn('[RenderingBootstrap] Failed to switch to SoccerFps:', res.error);
    }
    
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
   * Get underlying ThreeRenderer instance
   */
  getRenderer(): ThreeRenderer {
    return this.engine;
  }
}

export default RenderingBootstrap;
