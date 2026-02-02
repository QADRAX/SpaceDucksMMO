import type { GameScreenConfig } from './GameScreen';
import ScreenId from './ScreenId';
import SceneId from '../scene/SceneId';

/**
 * Game Screen Registry
 * 
 * Single source of truth for GameScreen configurations.
 * Defines the canonical mapping between UI Screens and 3D Scenes.
 * 
 * This ensures consistency across the application and makes it easy
 * to see all available game screens and their configurations.
 * 
 * Usage:
 * ```ts
 * import { GameScreens } from '@client/domain/ui/GameScreenRegistry';
 * 
 * // Navigate to main menu
 * navigate(GameScreens.MainMenu);
 * 
 * // Navigate to sandbox
 * navigate(GameScreens.Sandbox);
 * ```
 */

/**
 * Canonical GameScreen configurations
 */
export const GameScreens = {
  /**
   * Main Menu - Lobby with play button and settings
   */
  MainMenu: {
    screenId: ScreenId.Main,
    sceneId: SceneId.MainMenu,
    name: 'Main Menu'
  } as GameScreenConfig,

  /**
   * Sandbox - Testing environment for visual components
   */
  Sandbox: {
    screenId: ScreenId.Sandbox,
    sceneId: SceneId.Sandbox,
    name: 'Sandbox'
  } as GameScreenConfig,

  /** ECS Demo - small demo scene driven by ECS adapter POC */
  EcsDemo: {
    screenId: ScreenId.EcsDemo,
    sceneId: SceneId.EcsDemo,
    name: 'ECS Demo'
  } as GameScreenConfig,

  /** Soccer FPS - physics-based first-person soccer prototype */
  SoccerFps: {
    screenId: ScreenId.SoccerFps,
    sceneId: SceneId.SoccerFps,
    name: 'Soccer FPS'
  } as GameScreenConfig,

  // Add more game screens here as needed
  // Example:
  // ServerBrowser: {
  //   screenId: ScreenId.ServerList,
  //   sceneId: SceneId.ServerBrowser,
  //   name: 'Server Browser'
  // } as GameScreenConfig,
} as const;

/**
 * Type-safe helper to get a GameScreen config by ID
 */
export function getGameScreen(screenId: ScreenId): GameScreenConfig | undefined {
  return Object.values(GameScreens).find(gs => gs.screenId === screenId);
}

/**
 * List of all available game screen IDs
 */
export const AvailableGameScreens = Object.values(GameScreens).map(gs => gs.screenId);
