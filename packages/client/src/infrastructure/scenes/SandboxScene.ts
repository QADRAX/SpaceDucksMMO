import { BaseScene } from './BaseScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { SettingsService } from '@client/application/SettingsService';
import SceneId from '@client/domain/scene/SceneId';

/**
 * Minimal Sandbox scene used during ECS migration.
 */
export class SandboxScene extends BaseScene {
  readonly id = SceneId.Sandbox;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine, renderScene: any): void {
    super.setup(engine, renderScene);
    // empty by design for now
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    super.teardown(engine, renderScene);
  }
}

export default SandboxScene;
