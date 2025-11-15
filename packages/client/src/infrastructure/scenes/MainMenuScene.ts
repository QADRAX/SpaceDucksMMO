import { BaseScene } from './BaseScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { SettingsService } from '@client/application/SettingsService';
import SceneId from '@client/domain/scene/SceneId';

/**
 * Minimal Main Menu scene used during ECS migration.
 * Intentionally empty — UI is handled by screens. Keeps lifecycle hooks available.
 */
export class MainMenuScene extends BaseScene {
  readonly id = SceneId.MainMenu;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine): void {
    super.setup(engine);
    // Intentionally empty — main menu UI is handled by Preact screens
  }

  teardown(engine: IRenderingEngine): void {
    super.teardown(engine);
  }
}

export default MainMenuScene;
