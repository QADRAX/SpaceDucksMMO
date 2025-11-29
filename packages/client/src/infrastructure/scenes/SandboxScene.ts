import { BaseScene } from "./BaseScene";
import type IRenderingEngine from "@client/domain/ports/IRenderingEngine";
import type { SettingsService } from "@client/application/SettingsService";
import SceneId from "@client/domain/scene/SceneId";

import { Entity } from "@client/domain/ecs/core/Entity";
import { PlaneGeometryComponent } from "@client/domain/ecs/components/geometry/PlaneGeometryComponent";
import SphereGeometryComponent from "@client/domain/ecs/components/geometry/SphereGeometryComponent";
import { CameraViewComponent } from "@client/domain/ecs/components/CameraViewComponent";
import { MouseLookComponent } from "@client/domain/ecs/components/MouseLookComponent";
import { FirstPersonMoveComponent } from "@client/domain/ecs/components/FirstPersonMoveComponent";

import { BasicMaterialComponent } from "@client/domain/ecs/components/material/BasicMaterialComponent";
import { LambertMaterialComponent } from "@client/domain/ecs/components/material/LambertMaterialComponent";
import { PhongMaterialComponent } from "@client/domain/ecs/components/material/PhongMaterialComponent";
import { StandardMaterialComponent } from "@client/domain/ecs/components/material/StandardMaterialComponent";
import BaseMaterialComponent from "@client/domain/ecs/components/material/BaseMaterialComponent";

import AmbientLightComponent from "@client/domain/ecs/components/light/AmbientLightComponent";
import DirectionalLightComponent from "@client/domain/ecs/components/light/DirectionalLightComponent";

/**
 * Sandbox scene: material gallery showcasing Basic, Lambert, Phong and Standard materials
 * using the downloaded PBR texture sets under assets/textures/materials.
 *
 * Layout:
 * - Ground plane with a dirt material
 * - 3 rows (Z axis) of spheres, each row = texture set
 *   - X = -6  -> BasicMaterial
 *   - X = -2  -> LambertMaterial
 *   - X = +2  -> PhongMaterial
 *   - X = +6  -> StandardMaterial
 * - Camera orbits around the gallery center using OrbitComponent.
 */
export class SandboxScene extends BaseScene {
  readonly id = SceneId.Sandbox;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine, renderScene: any): void {
    super.setup(engine, renderScene);

    // --- Lights ----------------------------------------------------------------

    // Soft ambient light
    const ambient = new Entity("light-ambient").addComponent(
      new AmbientLightComponent({
        color: 0xffffff,
        intensity: 0.4,
      })
    );
    this.addEntity(ambient);

    // Main directional light for clear highlights
    const dir = new Entity("light-directional");
    dir.transform.setPosition(8, 10, 6);
    dir.addComponent(
      new DirectionalLightComponent({
        color: 0xffffff,
        intensity: 1.2,
        castShadow: false,
      })
    );
    this.addEntity(dir);

    // Secondary directional to fill shadows a bit
    const dir2 = new Entity("light-directional-2");
    dir2.transform.setPosition(-6, 4, -8);
    dir2.addComponent(
      new DirectionalLightComponent({
        color: 0xfff0e0,
        intensity: 0.5,
        castShadow: false,
      })
    );
    this.addEntity(dir2);

    // --- Ground plane ---------------------------------------------------------

    const ground = new Entity("ground");
    ground.addComponent(
      new PlaneGeometryComponent({
        width: 40,
        height: 40,
      })
    );

    // Use GroundDirt as floor
    ground.addComponent(
      new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 0,
        roughness: 1,
        texture: "materials/GroundDirt009/basecolor",
        normalMap: "materials/GroundDirt009/normal",
        aoMap: "materials/GroundDirt009/ambientOcclusion",
        roughnessMap: "materials/GroundDirt009/roughness",
      })
    );

    ground.transform.setRotation(-Math.PI / 2, 0, 0);
    ground.transform.setPosition(0, 0, 0);
    this.addEntity(ground);

    // --- Origin (center of gallery & camera target) ---------------------------

    const origin = new Entity("origin");
    origin.transform.setPosition(0, 1, 0);
    this.addEntity(origin);

    // --- Helper: create a sphere at (x, z) with a given material component ----

    const createSphere = (
      id: string,
      x: number,
      z: number,
      material: BaseMaterialComponent
    ) => {
      const e = new Entity(id);
      e.addComponent(
        new SphereGeometryComponent({
          radius: 1,
          widthSegments: 32,
          heightSegments: 16,
        })
      );
      e.addComponent(material);
      e.transform.setPosition(x, 1, z);
      this.addEntity(e);
    };

    const colBasicX = -6;
    const colLambertX = -2;
    const colPhongX = 2;
    const colStandardX = 6;

    const rowConcreteZ = -4;
    const rowMetalZ = 0;
    const rowGlassPlasticZ = 4;

    // ROW 1: concrete-muddy
    createSphere(
      "concrete-basic",
      colBasicX,
      rowConcreteZ,
      new BasicMaterialComponent({
        color: "#ffffff",
        texture: "materials/concrete-muddy/basecolor",
        normalMap: "materials/concrete-muddy/normal",
      })
    );

    createSphere(
      "concrete-lambert",
      colLambertX,
      rowConcreteZ,
      new LambertMaterialComponent({
        color: "#ffffff",
        texture: "materials/concrete-muddy/basecolor",
        normalMap: "materials/concrete-muddy/normal",
        aoMap: "materials/concrete-muddy/ambientOcclusion",
        bumpMap: "materials/concrete-muddy/height",
      })
    );

    createSphere(
      "concrete-phong",
      colPhongX,
      rowConcreteZ,
      new PhongMaterialComponent({
        color: "#cccccc",
        specular: "#222222",
        shininess: 20,
        texture: "materials/concrete-muddy/basecolor",
        normalMap: "materials/concrete-muddy/normal",
        aoMap: "materials/concrete-muddy/ambientOcclusion",
        bumpMap: "materials/concrete-muddy/height",
      })
    );

    createSphere(
      "concrete-standard",
      colStandardX,
      rowConcreteZ,
      new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 0,
        roughness: 1,
        texture: "materials/concrete-muddy/basecolor",
        normalMap: "materials/concrete-muddy/normal",
        aoMap: "materials/concrete-muddy/ambientOcclusion",
        roughnessMap: "materials/concrete-muddy/roughness",
      })
    );

    // ROW 2: Metal006
    createSphere(
      "metal006-basic",
      colBasicX,
      rowMetalZ,
      new BasicMaterialComponent({
        color: "#ffffff",
        texture: "materials/Metal006/basecolor",
      })
    );

    createSphere(
      "metal006-lambert",
      colLambertX,
      rowMetalZ,
      new LambertMaterialComponent({
        color: "#aaaaaa",
        texture: "materials/Metal006/basecolor",
        normalMap: "materials/Metal006/normal",
        aoMap: "materials/Metal006/ambientOcclusion",
        bumpMap: "materials/Metal006/height",
      })
    );

    createSphere(
      "metal006-phong",
      colPhongX,
      rowMetalZ,
      new PhongMaterialComponent({
        color: "#888888",
        specular: "#ffffff",
        shininess: 60,
        texture: "materials/Metal006/basecolor",
        normalMap: "materials/Metal006/normal",
        aoMap: "materials/Metal006/ambientOcclusion",
        bumpMap: "materials/Metal006/height",
      })
    );

    createSphere(
      "metal006-standard",
      colStandardX,
      rowMetalZ,
      new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 1,
        roughness: 0.3,
        texture: "materials/Metal006/basecolor",
        normalMap: "materials/Metal006/normal",
        aoMap: "materials/Metal006/ambientOcclusion",
        roughnessMap: "materials/Metal006/roughness",
        metalnessMap: "materials/Metal006/metallic",
      })
    );

    // ROW 3: Glass / Plastic / Water
    createSphere(
      "glass-basic",
      colBasicX,
      rowGlassPlasticZ,
      new BasicMaterialComponent({
        color: "#ffffff",
        texture: "materials/GlassFrosted001/basecolor",
        transparent: true,
        opacity: 0.6,
      })
    );

    createSphere(
      "glass-lambert",
      colLambertX,
      rowGlassPlasticZ,
      new LambertMaterialComponent({
        color: "#ffffff",
        texture: "materials/GlassFrosted001/basecolor",
        normalMap: "materials/GlassFrosted001/normal",
        aoMap: "materials/GlassFrosted001/ambientOcclusion",
        bumpMap: "materials/GlassFrosted001/height",
        transparent: true,
        opacity: 0.7,
      })
    );

    createSphere(
      "plastic-phong",
      colPhongX,
      rowGlassPlasticZ,
      new PhongMaterialComponent({
        color: "#ffffff",
        specular: "#ffffff",
        shininess: 80,
        texture: "materials/Plastic004/basecolor",
        normalMap: "materials/Plastic004/normal",
        aoMap: "materials/Plastic004/ambientOcclusion",
        bumpMap: "materials/Plastic004/height",
      })
    );

    createSphere(
      "water-standard",
      colStandardX,
      rowGlassPlasticZ,
      new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        texture: "materials/Water002/COLOR",
        normalMap: "materials/Water002/NORM",
        aoMap: "materials/Water002/OCC",
        roughnessMap: "materials/Water002/ROUGH",
      })
    );

    // --- Camera with controls --------------------------------------------------

    const camera = new Entity("main-camera");
    camera.addComponent(
      new CameraViewComponent({
        fov: 60,
        near: 0.1,
        far: 1000,
      })
    );

    camera.addComponent(
      new MouseLookComponent({
        // default params
      })
    );
    camera.addComponent(
      new FirstPersonMoveComponent({
        flyMode: true,
      })
    );

    camera.transform.setPosition(0, 10, 24);
    this.addEntity(camera);
    this.setActiveCamera("main-camera");

    console.log(
      "[SandboxScene] Material gallery (Basic/Lambert/Phong/Standard) ready"
    );
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    super.teardown(engine, renderScene);
  }
}

export default SandboxScene;
