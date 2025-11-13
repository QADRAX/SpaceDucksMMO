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
 * - Manage smooth transitions with fade effects
 * 
 * Clean Architecture:
 * - Depends on domain ports (IGameScreenNavigator)
 * - Uses infrastructure services (ScreenRouter, SceneManager)
 * - No UI or rendering details - pure coordination logic
 */
export class GameScreenManager implements IGameScreenNavigator {
  private currentScreen: GameScreenConfig | null = null;
  private transitionCallbacks: Array<(isTransitioning: boolean) => void> = [];
  private readonly TRANSITION_DURATION = 300; // ms
  private isInitialLoad = true; // Skip transition on first navigation

  constructor(
    private screenRouter: ScreenRouter,
    private sceneManager: SceneManager
  ) {}

  /**
   * Navigate to a complete game screen (UI + Scene) with smooth transition.
   * Fades out, switches scenes, waits for load, then fades in.
   */
  async navigateTo(config: GameScreenConfig): Promise<void> {
    console.log(`[GameScreenManager] Navigating to: ${config.name} (Screen: ${config.screenId}, Scene: ${config.sceneId})`);
    
    // Skip transition on initial load
    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      
      // Direct navigation without fade
      this.screenRouter.show(config.screenId);
      this.sceneManager.switchTo(config.sceneId);
      this.currentScreen = config;
      return;
    }
    
    // 1. Start fade-out
    this.notifyTransition(true);
    await this.wait(this.TRANSITION_DURATION);
    
    // 2. Transition UI screen (hidden behind fade)
    this.screenRouter.show(config.screenId);
    
    // 3. Transition 3D scene (hidden behind fade)
    this.sceneManager.switchTo(config.sceneId);
    
    // 4. Wait a bit for textures to start loading
    await this.wait(100);
    
    // 5. Update current state
    this.currentScreen = config;
    
    // 6. Start fade-in
    this.notifyTransition(false);
  }

  /**
   * Subscribe to transition state changes
   */
  onTransition(callback: (isTransitioning: boolean) => void): () => void {
    this.transitionCallbacks.push(callback);
    return () => {
      const index = this.transitionCallbacks.indexOf(callback);
      if (index > -1) this.transitionCallbacks.splice(index, 1);
    };
  }

  private notifyTransition(isTransitioning: boolean): void {
    this.transitionCallbacks.forEach(cb => cb(isTransitioning));
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
