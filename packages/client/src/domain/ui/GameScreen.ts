import type ScreenId from './ScreenId';
import type SceneId from '../scene/SceneId';

/**
 * Configuration for a complete game screen.
 * A GameScreen represents a cohesive unit that combines:
 * - A UI screen (Preact components for menus/HUD)
 * - A 3D scene (Three.js environment)
 * 
 * This abstraction allows thinking in terms of "game states" rather than
 * managing UI and 3D scenes separately.
 * 
 * @example
 * ```ts
 * const mainMenuConfig: GameScreenConfig = {
 *   screenId: ScreenId.Main,
 *   sceneId: SceneId.MainMenu,
 *   name: 'Main Menu'
 * };
 * ```
 */
export interface GameScreenConfig {
  /** Unique identifier for the UI screen */
  screenId: ScreenId;
  
  /** Unique identifier for the 3D scene */
  sceneId: SceneId;
  
  /** Human-readable name for debugging */
  name: string;
  
  /** Optional: Scene setup parameters */
  sceneParams?: Record<string, unknown>;
}

/**
 * Port for navigating between game screens.
 * Implementations should coordinate UI and Scene transitions atomically.
 */
export interface IGameScreenNavigator {
  /**
   * Navigate to a game screen (UI + Scene together) with smooth transition
   * @param config - The game screen configuration
   * @returns Promise that resolves when transition completes
   */
  navigateTo(config: GameScreenConfig): Promise<void>;
  
  /**
   * Get the currently active game screen configuration
   */
  getCurrentScreen(): GameScreenConfig | null;
}
