import { BaseScene } from "@duckengine/rendering-three";
import type { SettingsService } from "@client/application/SettingsService";
import SceneId from "@client/domain/scene/SceneId";
import type { IRenderingEngine } from "@duckengine/rendering-three";
import {
  Entity,
  SphereGeometryComponent,
  StandardMaterialComponent,
  LensFlareComponent,
  CameraViewComponent,
  OrbitComponent,
  LookAtEntityComponent,
  DirectionalLightComponent,
} from "@duckengine/rendering-three";

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
      new DirectionalLightComponent({
        type: "directionalLight",
        // type is mostly informational; metadata already uses this string
        color: 0xffffff,
        intensity: 1.0,
        castShadow: false,
      } as any)
    );
    this.addEntity(dir);

    // Sun - large yellow sphere
    const sun = new Entity("sun");
    sun.addComponent(
      new SphereGeometryComponent({
        radius: 5,
        widthSegments: 32,
        heightSegments: 16,
      })
    );
    sun.addComponent(
      new StandardMaterialComponent({
        color: "#ffff66",
        roughness: 0.5,
        metalness: 0.1,
      })
    );
    // Attach lens flare directly to the sun entity
    sun.addComponent(
      new LensFlareComponent({
        intensity: 0.9,
        color: "#ffff66",
        occlusionEnabled: true,
        elementCount: 3,
        baseElementSize: 0.6,
        distanceSpread: 0.6,
      })
    );
    sun.transform.setPosition(0, 0, 0);
    this.addEntity(sun);

    // Planet - small sphere orbiting the sun
    const planet = new Entity("planet");
    planet.addComponent(
      new SphereGeometryComponent({
        radius: 1,
        widthSegments: 24,
        heightSegments: 12,
      })
    );
    planet.addComponent(
      new StandardMaterialComponent({
        color: "#66aaff",
        roughness: 0.5,
        metalness: 0.1,
      })
    );
    planet.addComponent(
      new OrbitComponent({
        targetEntityId: "sun",
        altitudeFromSurface: 3,
        speed: 0.5,
        orbitPlane: "xz",
      })
    );
    this.addEntity(planet);

    const camera = new Entity("main-camera");
    camera.addComponent(
      new CameraViewComponent({ fov: 60, near: 0.1, far: 1000 })
    );
    // Orbit the camera around the sun and always look at it
    camera.addComponent(
      new OrbitComponent({
        targetEntityId: "sun",
        altitudeFromSurface: 20,
        speed: 0.25,
        orbitPlane: "xz",
        initialAngle: 0,
      })
    );
    camera.addComponent(
      new LookAtEntityComponent({ targetEntityId: "sun", offset: [0, 0, 0] })
    );
    this.addEntity(camera);
    this.setActiveCamera("main-camera");
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    super.teardown(engine, renderScene);
  }
}

export default MainMenuScene;
