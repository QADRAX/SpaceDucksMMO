import type { IGameScreenNavigator, GameScreenConfig } from '@client/domain/ui/GameScreen';
import type ScreenRouter from './ScreenRouter';
import type SceneManager from '../SceneManager';

/**
 * Application service that coordinates navigation between game screens.
 * 
 * A GameScreen combines:
 * - UI Screen (Preact components)
 * - 3D Scene (Three.js environment)
 * 
 * This service ensures both transitions happen atomically and provides
 * a single point of coordination for screen navigation.
 * 
 * Responsibilities:
 * - Coordinate UI and Scene transitions
 * - Track current game screen state
 * - Provide navigation API for the application layer
 * 
 * Clean Architecture:
 * - Depends on domain ports (IGameScreenNavigator)
 * - Uses infrastructure services (ScreenRouter, SceneManager)
 * - No UI or rendering details - pure coordination logic
 */
export class GameScreenManager implements IGameScreenNavigator {
  private currentScreen: GameScreenConfig | null = null;

  constructor(
    private screenRouter: ScreenRouter,
    private sceneManager: SceneManager
  ) {}

  /**
   * Navigate to a complete game screen (UI + Scene).
   * Transitions both the UI and 3D scene atomically.
   */
  navigateTo(config: GameScreenConfig): void {
    console.log(`[GameScreenManager] Navigating to: ${config.name} (Screen: ${config.screenId}, Scene: ${config.sceneId})`);
    
    // 1. Transition UI screen
    this.screenRouter.show(config.screenId);
    
    // 2. Transition 3D scene
    this.sceneManager.switchTo(config.sceneId);
    
    // 3. Update current state
    this.currentScreen = config;
  }

  /**
   * Get currently active game screen
   */
  getCurrentScreen(): GameScreenConfig | null {
    return this.currentScreen;
  }

  /**
   * Get the screen router for direct access if needed
   * (e.g., for modal overlays that don't change the scene)
   */
  getScreenRouter(): ScreenRouter {
    return this.screenRouter;
  }

  /**
   * Get the scene manager for direct access if needed
   * (e.g., for advanced scene control)
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }
}

export default GameScreenManager;
