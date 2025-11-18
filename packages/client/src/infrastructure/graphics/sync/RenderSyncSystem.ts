import * as THREE from "three";
import type { Entity, ComponentEvent, ComponentListener } from "../../../domain/ecs/core/Entity";
import type IComponentObserver from "../../../domain/ecs/core/IComponentObserver";
import { MaterialComponent } from "../../../domain/ecs/components/MaterialComponent";
import { ShaderMaterialComponent } from "../../../domain/ecs/components/ShaderMaterialComponent";
import { CameraViewComponent } from "../../../domain/ecs/components/CameraViewComponent";
import { LightComponent } from "../../../domain/ecs/components/LightComponent";
import { GeometryFactory, AnyGeometryComponent } from "../factories/GeometryFactory";
import { BoxGeometryComponent } from "../../../domain/ecs/components/BoxGeometryComponent";
import { SphereGeometryComponent } from "../../../domain/ecs/components/SphereGeometryComponent";
import { PlaneGeometryComponent } from "../../../domain/ecs/components/PlaneGeometryComponent";
import { CylinderGeometryComponent } from "../../../domain/ecs/components/CylinderGeometryComponent";
import { ConeGeometryComponent } from "../../../domain/ecs/components/ConeGeometryComponent";
import { TorusGeometryComponent } from "../../../domain/ecs/components/TorusGeometryComponent";
import { CustomGeometryComponent } from "../../../domain/ecs/components/CustomGeometryComponent";
import { MaterialFactory } from "../factories/MaterialFactory";
import { ShaderMaterialFactory } from "../factories/ShaderMaterialFactory";
import { CameraFactory } from "../factories/CameraFactory";
import { LightFactory } from "../factories/LightFactory";
import { TextureCache } from "../factories/TextureCache";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";

export class RenderSyncSystem implements IComponentObserver {
  private scene: THREE.Scene;
  private registry = new RenderObjectRegistry();
  private entities = new Map<string, Entity>();
  private componentListeners = new Map<string, ComponentListener>();
  private textureCache = new TextureCache();
  private uniformUpdater = new ShaderUniformUpdater();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Helper to obtain whichever geometry component an entity has (only one allowed by design)
  private getGeometryComponent(entity: Entity): AnyGeometryComponent | null {
    return (
      entity.getComponent<BoxGeometryComponent>("boxGeometry") ??
      entity.getComponent<SphereGeometryComponent>("sphereGeometry") ??
      entity.getComponent<PlaneGeometryComponent>("planeGeometry") ??
      entity.getComponent<CylinderGeometryComponent>("cylinderGeometry") ??
      entity.getComponent<ConeGeometryComponent>("coneGeometry") ??
      entity.getComponent<TorusGeometryComponent>("torusGeometry") ??
      entity.getComponent<CustomGeometryComponent>("customGeometry") ??
      null
    );
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    for (const comp of entity.getAllComponents()) comp.addObserver(this);
    // listen for future component additions/removals so we can register as observer
    // and create render objects when appropriate
    const listener: ComponentListener = (event: ComponentEvent) => {
      const { entity: e, component, action } = event;
      if (!this.entities.has(e.id)) return;
      if (action === 'added') {
        component.addObserver(this);
        // if there's no existing render object for this entity, a newly added
        // render-relevant component should cause creation
        if (!this.registry.has(e.id)) this.processEntity(e);
      }
      // removals are handled via component.notifyRemoved -> onComponentChanged(':removed')
    };
    this.componentListeners.set(entity.id, listener);
    entity.addComponentListener(listener);
    entity.transform.onChange(() => this.onTransformChanged(entity.id));
    this.processEntity(entity);
    for (const child of entity.getChildren()) this.addEntity(child);
  }

  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    for (const child of entity.getChildren()) this.removeEntity(child.id);
    // remove component listener if present
    const l = this.componentListeners.get(entityId);
    if (l) {
      entity.removeComponentListener(l);
      this.componentListeners.delete(entityId);
    }
    this.registry.remove(entityId, this.scene);
    this.entities.delete(entityId);
  }

  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.registry.get(entityId);
    return rc?.object3D instanceof THREE.Camera ? rc.object3D : undefined;
  }

  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  onComponentChanged(entityId: string, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    // support removal notifications encoded as 'type:removed'
    if (componentType.endsWith(':removed')) {
      const base = componentType.split(':')[0];
      switch (base) {
        case 'boxGeometry':
        case 'sphereGeometry':
        case 'planeGeometry':
        case 'cylinderGeometry':
        case 'coneGeometry':
        case 'torusGeometry':
        case 'customGeometry':
        case 'shaderMaterial':
        case 'material':
        case 'light':
        case 'cameraView':
          this.registry.remove(entityId, this.scene);
          break;
        default:
          break;
      }
      return;
    }

    switch (componentType) {
      case "boxGeometry":
      case "sphereGeometry":
      case "planeGeometry":
      case "cylinderGeometry":
      case "coneGeometry":
      case "torusGeometry":
      case "customGeometry":
      case "shaderMaterial":
        this.recreateMesh(entity);
        break;
      case "material":
        this.syncMaterial(entity);
        break;
      case "cameraView":
        this.syncCamera(entity);
        break;
      case "light":
        this.recreateLight(entity);
        break;
      default:
        break;
    }
  }

  private processEntity(entity: Entity): void {
    const geometry = this.getGeometryComponent(entity);
    const material = entity.getComponent<MaterialComponent>("material");
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
    if (
      geometry && geometry.enabled !== false &&
      ((material && material.enabled !== false) || (shaderMaterial && shaderMaterial.enabled !== false))
    ) {
      this.createMesh(entity, geometry, material, shaderMaterial);
      return;
    }
    const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
    if (cameraView && cameraView.enabled !== false) {
      this.createCamera(entity, cameraView);
      return;
    }
    const lightComp = entity.getComponent<LightComponent>("light");
    if (lightComp && lightComp.enabled !== false) {
      this.createLight(entity, lightComp);
      return;
    }
  }

  private createMesh(
    entity: Entity,
    geometryComp: AnyGeometryComponent,
    materialComp?: MaterialComponent,
    shaderMaterialComp?: ShaderMaterialComponent
  ): void {
    const geometry = GeometryFactory.build(geometryComp);
    let material: THREE.Material;
    if (shaderMaterialComp)
      material = ShaderMaterialFactory.build(
        shaderMaterialComp,
        this.textureCache
      );
    else material = MaterialFactory.build(materialComp!, this.textureCache);
    const mesh = new THREE.Mesh(geometry, material);
    this.syncTransformToObject3D(entity, mesh);
    this.scene.add(mesh);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: mesh,
      geometry,
      material,
    });
  }

  private createCamera(entity: Entity, cameraView: CameraViewComponent): void {
    const camera = CameraFactory.build(cameraView);
    this.syncTransformToObject3D(entity, camera);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: camera,
    });
  }

  private recreateMesh(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const geometry = this.getGeometryComponent(entity);
    const material = entity.getComponent<MaterialComponent>("material");
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

    // If we have an existing rendered object and components are disabled, hide it
    if (rc?.object3D) {
      const shouldBeVisible =
        !!geometry && geometry.enabled !== false &&
        ((material && material.enabled !== false) || (shaderMaterial && shaderMaterial.enabled !== false));
      if (!shouldBeVisible) {
        rc.object3D.visible = false;
        return;
      }

      // If should be visible but we have an existing object, remove and recreate to apply changes
      this.scene.remove(rc.object3D);
      if (rc.geometry) rc.geometry.dispose();
      if (rc.material) rc.material.dispose();
      this.registry.remove(entity.id, this.scene);
    }

    if (
      geometry && geometry.enabled !== false &&
      ((material && material.enabled !== false) || (shaderMaterial && shaderMaterial.enabled !== false))
    ) {
      this.createMesh(entity, geometry, material, shaderMaterial);
    }
  }

  private syncMaterial(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;
    const materialComp = entity.getComponent<MaterialComponent>("material");
    // If material removed or disabled, hide mesh but keep registry/resources
    if (!materialComp || materialComp.enabled === false) {
      rc.object3D.visible = false;
      return;
    }
    if (rc.material) rc.material.dispose();
    const newMat = MaterialFactory.build(materialComp, this.textureCache);
    rc.object3D.material = newMat;
    rc.material = newMat;
    rc.object3D.visible = true;
  }

  private syncCamera(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.PerspectiveCamera))
      return;
    const cv = entity.getComponent<CameraViewComponent>("cameraView");
    if (!cv) return;
    rc.object3D.fov = cv.fov;
    rc.object3D.aspect = cv.aspect;
    rc.object3D.near = cv.near;
    rc.object3D.far = cv.far;
    rc.object3D.updateProjectionMatrix();
  }

  private recreateLight(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const lightComp = entity.getComponent<LightComponent>("light");
    if (rc?.object3D) {
      if (!lightComp || lightComp.enabled === false) {
        rc.object3D.visible = false;
        return;
      }
      this.scene.remove(rc.object3D);
      if (rc) this.registry.remove(entity.id, this.scene);
    }
    if (lightComp && lightComp.enabled !== false) this.createLight(entity, lightComp);
  }

  private onTransformChanged(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    const rc = this.registry.get(entityId);
    if (!rc?.object3D) return;
    this.syncTransformToObject3D(entity, rc.object3D);
    if (
      rc.object3D instanceof THREE.DirectionalLight ||
      rc.object3D instanceof THREE.SpotLight
    ) {
      LightFactory.updateDirectionalTarget(rc.object3D, entity);
    }
  }

  private syncTransformToObject3D(
    entity: Entity,
    object3D: THREE.Object3D
  ): void {
    const t = entity.transform;
    object3D.position.copy(t.worldPosition);
    object3D.rotation.copy(t.worldRotation);
    object3D.scale.copy(t.worldScale);
  }

  update(dt: number): void {
    for (const [id, rc] of this.registry.getAll()) {
      const entity = this.entities.get(id);
      if (!entity) continue;
      this.uniformUpdater.update(dt, entity, rc);
    }
  }

  private createLight(entity: Entity, lightComp: LightComponent): void {
    const light = LightFactory.build(entity, lightComp, this.scene);
    this.scene.add(light);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: light,
    });
  }
}

export default RenderSyncSystem;
