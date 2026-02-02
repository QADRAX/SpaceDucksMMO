import type { IGameScreenNavigator, GameScreenConfig } from '@client/domain/ui/GameScreen';
import type ScreenRouter from './ScreenRouter';
import type SceneManager from '../SceneManager';
import SceneId from '../../domain/scene/SceneId';

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
  private isTransitioning = false; // Flag to track if we're in the middle of a transition

  constructor(
    private screenRouter: ScreenRouter,
    private sceneManager: SceneManager
  ) {
    this.navigateTo = this.navigateTo.bind(this); // Bind the method to ensure correct `this` context
  }

  /**
   * Map SceneId to the expected scene identifier.
   */
  private mapSceneId(sceneId: SceneId): string {
    const sceneMapping: Record<SceneId, string> = {
      [SceneId.MainMenu]: 'main-menu',
      [SceneId.Sandbox]: 'sandbox',
      [SceneId.GameWorld]: 'game-world',
      [SceneId.ServerBrowser]: 'server-browser',
      [SceneId.EcsDemo]: 'ecs-demo',
      [SceneId.SoccerFps]: 'soccer-fps',
    };
    return sceneMapping[sceneId] || sceneId;
  }

  /**
   * Navigate to a complete game screen (UI + Scene) with smooth transition.
   * Fades out, switches scenes, waits for load, then fades in.
   */
  async navigateTo(config: GameScreenConfig): Promise<void> {
    // Skip transition on initial load
    if (this.isInitialLoad) {
      this.isInitialLoad = false;

      // Switch scene FIRST, then screen
      this.sceneManager.switchTo(this.mapSceneId(config.sceneId));
      this.screenRouter.show(config.screenId);
      this.currentScreen = config;

      // Notify transition callbacks even during initial load
      this.notifyTransition(false);
      return;
    }

    // 1. Start fade-out
    this.isTransitioning = true; // Ensure the flag is set before notifying
    this.notifyTransition(this.isTransitioning);
    await this.wait(this.TRANSITION_DURATION);

    // 2. Transition 3D scene FIRST (hidden behind fade)
    this.sceneManager.switchTo(this.mapSceneId(config.sceneId));

    // 3. Wait a bit for scene setup to complete
    await this.wait(50);

    // 4. Transition UI screen (now scene is ready)
    this.screenRouter.show(config.screenId);

    // 5. Wait a bit more for textures to start loading
    await this.wait(50);

    // 6. Update current state
    this.currentScreen = config;

    // 7. Start fade-in
    this.isTransitioning = false;
    this.notifyTransition(this.isTransitioning);
  }

  /**
   * Subscribe to transition state changes
   */
  onTransition(callback: (isTransitioning: boolean) => void): () => void {
    this.transitionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.transitionCallbacks.indexOf(callback);
      if (index > -1) {
        this.transitionCallbacks.splice(index, 1);
      }
    };
  }

  private notifyTransition(isTransitioning: boolean): void {
    // Create a copy of the callbacks to avoid issues with modifications during iteration
    const callbacks = [...this.transitionCallbacks];

    callbacks.forEach((cb) => {
      try {
        cb(isTransitioning);
      } catch (error) {
        console.error('[GameScreenManager] Error executing transition callback:', error);
      }
    });
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
