import * as THREE from "three";
import type { Entity } from "../../../domain/ecs/core/Entity";
import type IComponentObserver from "../../../domain/ecs/core/IComponentObserver";
import { GeometryComponent } from "../../../domain/ecs/components/GeometryComponent";
import { MaterialComponent } from "../../../domain/ecs/components/MaterialComponent";
import { ShaderMaterialComponent } from "../../../domain/ecs/components/ShaderMaterialComponent";
import { CameraViewComponent } from "../../../domain/ecs/components/CameraViewComponent";
import { LightComponent } from "../../../domain/ecs/components/LightComponent";
import { GeometryFactory } from "../factories/GeometryFactory";
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
  private textureCache = new TextureCache();
  private uniformUpdater = new ShaderUniformUpdater();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    for (const comp of entity.getAllComponents()) comp.addObserver(this);
    entity.transform.onChange(() => this.onTransformChanged(entity.id));
    this.processEntity(entity);
    for (const child of entity.getChildren()) this.addEntity(child);
  }

  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    for (const child of entity.getChildren()) this.removeEntity(child.id);
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
    switch (componentType) {
      case "geometry":
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
    const geometry = entity.getComponent<GeometryComponent>("geometry");
    const material = entity.getComponent<MaterialComponent>("material");
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
    if (geometry && (material || shaderMaterial)) {
      this.createMesh(entity, geometry, material, shaderMaterial);
      return;
    }
    const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
    if (cameraView) {
      this.createCamera(entity, cameraView);
      return;
    }
    const lightComp = entity.getComponent<LightComponent>("light");
    if (lightComp) {
      this.createLight(entity, lightComp);
      return;
    }
  }

  private createMesh(
    entity: Entity,
    geometryComp: GeometryComponent,
    materialComp?: MaterialComponent,
    shaderMaterialComp?: ShaderMaterialComponent
  ): void {
    const geometry = GeometryFactory.build(geometryComp.parameters);
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
    if (rc?.object3D) {
      this.scene.remove(rc.object3D);
      if (rc.geometry) rc.geometry.dispose();
      if (rc.material) rc.material.dispose();
    }
    const geometry = entity.getComponent<GeometryComponent>("geometry");
    const material = entity.getComponent<MaterialComponent>("material");
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
    if (geometry && (material || shaderMaterial))
      this.createMesh(entity, geometry, material, shaderMaterial);
  }

  private syncMaterial(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;
    const materialComp = entity.getComponent<MaterialComponent>("material");
    if (!materialComp) return;
    if (rc.material) rc.material.dispose();
    const newMat = MaterialFactory.build(materialComp, this.textureCache);
    rc.object3D.material = newMat;
    rc.material = newMat;
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
    if (rc?.object3D) this.scene.remove(rc.object3D);
    const lightComp = entity.getComponent<LightComponent>("light");
    if (lightComp) this.createLight(entity, lightComp);
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
