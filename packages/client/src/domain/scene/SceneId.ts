/**
 * Unique identifiers for available 3D scenes in the game.
 */
enum SceneId {
  /** Main menu background scene (ambient, non-interactive) */
  MainMenu = 'main-menu',
  /** Game world scene (gameplay, player interaction) */
  GameWorld = 'game-world',
  /** Server browser background scene (optional animated backdrop) */
  ServerBrowser = 'server-browser',
  /** Sandbox scene (testing and prototyping visual components) */
  Sandbox = 'sandbox',
}

export default SceneId;
