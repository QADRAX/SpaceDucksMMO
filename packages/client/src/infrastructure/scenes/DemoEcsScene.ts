import { BaseScene } from './BaseScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { SettingsService } from '@client/application/SettingsService';
import * as THREE from 'three';
import { Entity } from '@client/infrastructure/scene-ecs/Entity';
import { TransformComponent } from '@client/infrastructure/scene-ecs/TransformComponent';
import RotationComponent from '@client/infrastructure/scene-ecs/RotationComponent';
import { SceneEntity } from '@client/infrastructure/scene-ecs/SceneEntity';
import { CameraEntity } from '@client/infrastructure/scene-ecs/CameraEntity';
import type TextureResolverService from '@client/application/TextureResolverService';
import SceneId from '@client/domain/scene/SceneId';

/**
 * Small demo scene that demonstrates the ECS -> Render adapter approach.
 * This scene is intentionally minimal: two planets and a sun, each driven by a
 * TransformComponent and rendered by `VisualBody` via `RenderAdapter`.
 */
export class DemoEcsScene extends BaseScene {
  readonly id = SceneId.EcsDemo;
  private textureResolver: TextureResolverService;
  private entities: Entity[] = [];
  private ambientLight?: THREE.AmbientLight;
  private sunLight?: THREE.PointLight;
  private axes?: THREE.AxesHelper;
  private cameraEntity?: CameraEntity;

  constructor(settingsService: SettingsService, textureResolver: TextureResolverService) {
    super(settingsService);
    this.textureResolver = textureResolver;
  }

  setup(engine: IRenderingEngine): void {
    super.setup(engine);

    // Create a camera entity and activate it on the engine (phase 2: engine uses ECS cameras)
    this.cameraEntity = new CameraEntity('camera-main', { fov: 60 });
    // Track camera entity as a scene object so it's updated/teardown with the scene
    this.addObject(engine, this.cameraEntity);
    // Activate camera on engine so renderer uses it
    this.cameraEntity.activate(engine);

    // Add simple lighting so MeshStandardMaterial is visible
    const scene = engine.getScene();
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(this.ambientLight);

    // Create sun (native SceneEntity using new ECS primitives)
    const sunEntity = new SceneEntity('sun-1', { radius: 1.0, textureId: 'sun', emissive: 0xffaa00 }, this.textureResolver);
    // Add rotation component to entity
    sunEntity.entity.addComponent(new RotationComponent(sunEntity.transform, 0.0001));
    this.entities.push(sunEntity.entity);
    this.addObject(engine, sunEntity);

    // Add a point light attached to the sun position to simulate emissive sun
    this.sunLight = new THREE.PointLight(0xffeeaa, 2.5, 100);
    this.sunLight.position.copy(sunEntity.transform.position);
    scene.add(this.sunLight);

    // Add axes helper for debugging visuals
    this.axes = new THREE.AxesHelper(2.0);
    scene.add(this.axes);

    // Planet A
    const planetA = new SceneEntity('planet-a', { radius: 0.5, textureId: 'rocky-planet', color: 0xffffff }, this.textureResolver);
    planetA.transform.setPosition(-3.5, 0, 0);
    planetA.entity.addComponent(new RotationComponent(planetA.transform, 0.00005));
    this.entities.push(planetA.entity);
    this.addObject(engine, planetA);

    // Planet B
    const planetB = new SceneEntity('planet-b', { radius: 0.4, textureId: 'rocky-planet', color: 0x88ccff }, this.textureResolver);
    planetB.transform.setPosition(3, 0, 0);
    planetB.entity.addComponent(new RotationComponent(planetB.transform, 0.00003));
    this.entities.push(planetB.entity);
    this.addObject(engine, planetB);
  }

  update(dt: number): void {
    if (this.cameraEntity) this.cameraEntity.update(dt);
    // Simple logic: rotate planets around their own Y axis
    for (const e of this.entities) {
      const t = e.getComponent( 'transform' ) as TransformComponent | undefined;
      if (t) {
        // rotate by a small amount scaled by dt
        t.rotation.y += 0.0005 * dt;
      }
      e.update(dt);
    }

    // Let BaseScene update objects/controllers
    super.update(dt);
  }

  teardown(engine: IRenderingEngine): void {
    super.teardown(engine);
    const scene = engine.getScene();
    if (this.ambientLight) { scene.remove(this.ambientLight); this.ambientLight = undefined; }
    if (this.sunLight) { scene.remove(this.sunLight); this.sunLight = undefined; }
    if (this.axes) { scene.remove(this.axes); this.axes = undefined; }
    this.entities = [];
  }
}

export default DemoEcsScene;
