import { BaseScene } from './BaseScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { SettingsService } from '@client/application/SettingsService';
import SceneId from '@client/domain/scene/SceneId';

// ECS
import { Entity } from '@client/domain/ecs/core/Entity';
import { PlaneGeometryComponent } from '@client/domain/ecs/components/PlaneGeometryComponent';
import { BoxGeometryComponent } from '@client/domain/ecs/components/BoxGeometryComponent';
import { StandardMaterialComponent } from '@client/domain/ecs/components/StandardMaterialComponent';
import { CameraViewComponent } from '@client/domain/ecs/components/CameraViewComponent';
import { CameraTargetComponent } from '@client/domain/ecs/components/CameraTargetComponent';
import { LightComponent } from '@client/domain/ecs/components/LightComponent';

/**
 * Demo scene showcasing the new ECS architecture with:
 * - Transform integrado en Entity
 * - Componentes composables (Geometry, Material, ShaderMaterial)
 * - Órbitas con consideración de geometría y escala
 * - Cámara con target tracking
 * - Efectos visuales (atmósfera, corona solar, lens flare, post-process)
 * - Reactividad automática (cambiar propiedades → actualización inmediata en THREE.js)
 */
export class DemoEcsScene extends BaseScene {
  readonly id = SceneId.EcsDemo;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  // Escena básica: caja, plano de suelo, luz ambiental + direccional y una cámara
  setup(engine: IRenderingEngine, renderScene: any): void {
    super.setup(engine, renderScene);

    // Luces
    const ambient = new Entity('light-ambient')
      .addComponent(new LightComponent({ type: 'ambient', color: 0xffffff, intensity: 0.4 }));
    this.addEntity(ambient);

    const dir = new Entity('light-directional');
    dir.transform.setPosition(5, 5, 5);
    dir.addComponent(new LightComponent({ type: 'directional', color: 0xffffff, intensity: 1.0 }));
    this.addEntity(dir);

    // Plano (suelo)
    const ground = new Entity('ground');
    ground.addComponent(new PlaneGeometryComponent({ width: 30, height: 30 }));
    ground.addComponent(new StandardMaterialComponent({ color: '#808080', roughness: 1.0, metalness: 0.0 }));
    ground.transform.setRotation(-Math.PI / 2, 0, 0); // hacer horizontal
    this.addEntity(ground);

    // Caja simple
    const box = new Entity('box');
    box.addComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 }));
    box.addComponent(new StandardMaterialComponent({ color: '#44aa88', roughness: 0.5, metalness: 0.1 }));
    box.transform.setPosition(0, 0.5, 0);
    this.addEntity(box);

    // Punto de mira (origen)
    const origin = new Entity('origin');
    this.addEntity(origin);

    // Cámara
    const camera = new Entity('main-camera');
    camera.transform.setPosition(4, 3, 8);
    camera.addComponent(new CameraViewComponent({ fov: 60, near: 0.1, far: 1000 }));
    camera.addComponent(new CameraTargetComponent({ targetEntityId: 'origin' }));
    this.addEntity(camera);
    this.setActiveCamera('main-camera');

    console.log('[DemoEcsScene] Basic ECS scene ready (box + ground + lights)');
  }
}

export default DemoEcsScene;
