import { BaseScene } from "./BaseScene";
import type IRenderingEngine from "@client/domain/ports/IRenderingEngine";
import type { SettingsService } from "@client/application/SettingsService";
import SceneId from "@client/domain/scene/SceneId";
import LightComponent from "@client/domain/ecs/components/LightComponent";
import { Entity } from "@client/domain/ecs/core/Entity";
import SphereGeometryComponent from "@client/domain/ecs/components/SphereGeometryComponent";
import { StandardMaterialComponent } from "@client/domain/ecs/components/StandardMaterialComponent";
import CameraViewComponent from "@client/domain/ecs/components/CameraViewComponent";
import CameraTargetComponent from "@client/domain/ecs/components/CameraTargetComponent";

/**
 * Minimal Main Menu scene used during ECS migration.
 * Intentionally empty — UI is handled by screens. Keeps lifecycle hooks available.
 */
export class MainMenuScene extends BaseScene {
  readonly id = SceneId.MainMenu;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine, renderScene: any): void {
    super.setup(engine, renderScene);

    const dir = new Entity("light-directional");
    dir.transform.setPosition(5, 5, 5);
    dir.addComponent(
      new LightComponent({
        type: "directional",
        color: 0xffffff,
        intensity: 1.0,
      })
    );
    this.addEntity(dir);

    const sphere = new Entity("sphere");
    sphere.addComponent(
      new SphereGeometryComponent({
        radius: 1,
        widthSegments: 32,
        heightSegments: 16,
      })
    );
    sphere.addComponent(
      new StandardMaterialComponent({
        color: "#44aa88",
        roughness: 0.5,
        metalness: 0.1,
      })
    );
    sphere.transform.setPosition(0, 0.5, 0);
    this.addEntity(sphere);

    const camera = new Entity("main-camera");
    camera.transform.setPosition(4, 3, 8);
    camera.addComponent(
      new CameraViewComponent({ fov: 60, near: 0.1, far: 1000 })
    );
    camera.addComponent(
      new CameraTargetComponent({ targetEntityId: "origin" })
    );
    this.addEntity(camera);
    this.setActiveCamera("main-camera");
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    super.teardown(engine, renderScene);
  }
}

export default MainMenuScene;
