import { BaseScene } from "./BaseScene";
import type IRenderingEngine from "@client/domain/ports/IRenderingEngine";
import type { SettingsService } from "@client/application/SettingsService";
import SceneId from "@client/domain/scene/SceneId";
import LightComponent from "@client/domain/ecs/components/LightComponent";
import { Entity } from "@client/domain/ecs/core/Entity";
import SphereGeometryComponent from "@client/domain/ecs/components/geometry/SphereGeometryComponent";
import { StandardMaterialComponent } from "@client/domain/ecs/components/material/StandardMaterialComponent";
import CameraViewComponent from "@client/domain/ecs/components/CameraViewComponent";
import { OrbitComponent } from "@client/domain/ecs/components/OrbitComponent";
import { LookAtEntityComponent } from '@client/domain/ecs/components/LookAtEntityComponent';

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

    // register this scene as the current ECS world
    if ((this as any).onActivate) (this as any).onActivate();

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

    // Sun - large yellow sphere
    const sun = new Entity('sun');
    sun.addComponent(new SphereGeometryComponent({ radius: 5, widthSegments: 32, heightSegments: 16 }));
    sun.addComponent(new StandardMaterialComponent({ color: '#ffff66', roughness: 0.5, metalness: 0.1 }));
    sun.transform.setPosition(0, 0, 0);
    this.addEntity(sun);

    // Planet - small sphere orbiting the sun
    const planet = new Entity('planet');
    planet.addComponent(new SphereGeometryComponent({ radius: 1, widthSegments: 24, heightSegments: 12 }));
    planet.addComponent(new StandardMaterialComponent({ color: '#66aaff', roughness: 0.5, metalness: 0.1 }));
    planet.addComponent(new OrbitComponent({ targetEntityId: 'sun', altitudeFromSurface: 3, speed: 0.5, orbitPlane: 'xz' }));
    this.addEntity(planet);

    const camera = new Entity('main-camera');
    camera.transform.setPosition(0, 10, 20);
    camera.addComponent(new CameraViewComponent({ fov: 60, near: 0.1, far: 1000 }));
    camera.addComponent(new LookAtEntityComponent({ targetEntityId: 'sun', offset: [0, 0, 0] }));
    this.addEntity(camera);
    this.setActiveCamera('main-camera');
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    super.teardown(engine, renderScene);
  }
}

export default MainMenuScene;
