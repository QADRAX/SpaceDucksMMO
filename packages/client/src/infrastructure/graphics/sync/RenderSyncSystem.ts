import * as THREE from "three";
import type {
  Entity,
  ComponentEvent,
  ComponentListener,
} from "../../../domain/ecs/core/Entity";
import type IComponentObserver from "../../../domain/ecs/core/IComponentObserver";
import type { StandardMaterialComponent } from "../../../domain/ecs/components/material/StandardMaterialComponent";
import type { BasicMaterialComponent } from "../../../domain/ecs/components/material/BasicMaterialComponent";
import type { PhongMaterialComponent } from "../../../domain/ecs/components/material/PhongMaterialComponent";
import type { LambertMaterialComponent } from "../../../domain/ecs/components/material/LambertMaterialComponent";
import { ShaderMaterialComponent } from "../../../domain/ecs/components/material/ShaderMaterialComponent";
import { LensFlareComponent } from "../../../domain/ecs/components/LensFlareComponent";
import { CameraViewComponent } from "../../../domain/ecs/components/CameraViewComponent";
import { LightComponent } from "../../../domain/ecs/components/LightComponent";
import {
  GeometryFactory,
  AnyGeometryComponent,
} from "../factories/GeometryFactory";
import { BoxGeometryComponent } from "../../../domain/ecs/components/geometry/BoxGeometryComponent";
import { SphereGeometryComponent } from "../../../domain/ecs/components/geometry/SphereGeometryComponent";
import { PlaneGeometryComponent } from "../../../domain/ecs/components/geometry/PlaneGeometryComponent";
import { CylinderGeometryComponent } from "../../../domain/ecs/components/geometry/CylinderGeometryComponent";
import { ConeGeometryComponent } from "../../../domain/ecs/components/geometry/ConeGeometryComponent";
import { TorusGeometryComponent } from "../../../domain/ecs/components/geometry/TorusGeometryComponent";
import { CustomGeometryComponent } from "../../../domain/ecs/components/geometry/CustomGeometryComponent";
import { MaterialFactory } from "../factories/MaterialFactory";
import type { AnyMaterialComponent } from "../factories/MaterialFactory";
import { ShaderMaterialFactory } from "../factories/ShaderMaterialFactory";
import { CameraFactory } from "../factories/CameraFactory";
import { LightFactory } from "../factories/LightFactory";
import { TextureCache } from "../factories/TextureCache";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import LensFlareFactory from "../factories/LensFlareFactory";

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

  // Helper to obtain whichever material component an entity has (only one allowed by design)
  private getMaterialComponent(entity: Entity): AnyMaterialComponent | null {
    return (
      entity.getComponent<StandardMaterialComponent>("standardMaterial") ??
      entity.getComponent<BasicMaterialComponent>("basicMaterial") ??
      entity.getComponent<PhongMaterialComponent>("phongMaterial") ??
      entity.getComponent<LambertMaterialComponent>("lambertMaterial") ??
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
      if (action === "added") {
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
    if (componentType.endsWith(":removed")) {
      const base = componentType.split(":")[0];
      switch (base) {
        case "boxGeometry":
        case "sphereGeometry":
        case "planeGeometry":
        case "cylinderGeometry":
        case "coneGeometry":
        case "torusGeometry":
        case "customGeometry":
        case "shaderMaterial":
        case "standardMaterial":
        case "basicMaterial":
        case "phongMaterial":
        case "lambertMaterial":
        case "light":
        case "cameraView":
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
      case "standardMaterial":
      case "basicMaterial":
      case "phongMaterial":
      case "lambertMaterial":
        this.syncMaterial(entity);
        break;
      case "cameraView":
        this.syncCamera(entity);
        break;
      case "light":
        this.recreateLight(entity);
        break;
      case "lensFlare":
        this.recreateLensFlare(entity);
        break;
      default:
        break;
    }
  }

  private processEntity(entity: Entity): void {
    const geometry = this.getGeometryComponent(entity);
    const material = this.getMaterialComponent(
      entity
    ) as AnyMaterialComponent | null;
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
    const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
    const lightComp = entity.getComponent<LightComponent>("light");
    const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");

    // 1) Mesh (geometry + material/shader)
    if (
      geometry &&
      geometry.enabled !== false &&
      ((material && material.enabled !== false) ||
        (shaderMaterial && shaderMaterial.enabled !== false))
    ) {
      this.createMesh(entity, geometry, material, shaderMaterial);
      // If the same entity also has a lens flare, attach it as a child
      if (lensComp && lensComp.enabled !== false) {
        this.createLensFlare(entity, lensComp);
      }
      return;
    }

    // 2) Camera
    if (cameraView && cameraView.enabled !== false) {
      this.createCamera(entity, cameraView);
      if (lensComp && lensComp.enabled !== false) {
        this.createLensFlare(entity, lensComp);
      }
      return;
    }

    // 3) Light
    if (lightComp && lightComp.enabled !== false) {
      this.createLight(entity, lightComp);
      if (lensComp && lensComp.enabled !== false) {
        this.createLensFlare(entity, lensComp);
      }
      return;
    }

    // 4) Standalone lens flare entity (no mesh/camera/light)
    if (lensComp && lensComp.enabled !== false) {
      this.createLensFlare(entity, lensComp);
      return;
    }
  }

  private createMesh(
    entity: Entity,
    geometryComp: AnyGeometryComponent,
    materialComp?: AnyMaterialComponent | null,
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
    const material = this.getMaterialComponent(
      entity
    ) as AnyMaterialComponent | null;
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

    // If we have an existing rendered object and components are disabled, hide it
    if (rc?.object3D) {
      const shouldBeVisible =
        !!geometry &&
        geometry.enabled !== false &&
        ((material && material.enabled !== false) ||
          (shaderMaterial && shaderMaterial.enabled !== false));
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
      geometry &&
      geometry.enabled !== false &&
      ((material && material.enabled !== false) ||
        (shaderMaterial && shaderMaterial.enabled !== false))
    ) {
      this.createMesh(entity, geometry, material, shaderMaterial);
    }
  }

  private syncMaterial(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;
    const materialComp = this.getMaterialComponent(
      entity
    ) as AnyMaterialComponent | null;
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
    if (lightComp && lightComp.enabled !== false)
      this.createLight(entity, lightComp);
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
    // Sync simple lens flare visuals (if present)
    // Find an active camera (first camera present in registry)
    let activeCamera: THREE.Camera | undefined;
    for (const rcCam of this.registry.getAll().values()) {
      if (rcCam.object3D instanceof THREE.Camera) {
        activeCamera = rcCam.object3D as THREE.Camera;
        break;
      }
    }

    for (const [id, rc] of this.registry.getAll()) {
      const entity = this.entities.get(id);
      if (!entity) continue;
      const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");
      if (!lensComp) continue;
      if (!rc?.object3D) continue;

      // locate the lens-flare group (may be the object3D itself or a child)
      let group: THREE.Object3D | undefined;
      if (rc.object3D instanceof THREE.Group) group = rc.object3D;
      else if (rc.object3D.getObjectByName)
        group = rc.object3D.getObjectByName(`lensflare-${lensComp.type}`) as
          | THREE.Object3D
          | undefined;
      if (!group) continue;

      // If there is no camera, just apply base opacities/scales
      if (!activeCamera) {
        group.children.forEach((child, idx) => {
          if (!(child instanceof THREE.Sprite)) return;
          const sprite = child as THREE.Sprite;
          if (idx === 0) {
            sprite.material.opacity = Math.max(0, Math.min(1, lensComp.intensity ?? 1));
          } else {
            const meta = (sprite as any).userData || lensComp.flareElements?.[idx - 1];
            if (meta) {
              const baseOpacity = meta.opacity ?? (sprite.material.opacity as number);
              sprite.material.opacity = Math.max(0, Math.min(1, baseOpacity * (lensComp.intensity ?? 1)));
              const scale = meta.size ?? (sprite.scale.x || 0.5);
              sprite.scale.set(scale, scale, 1);
            }
          }
        });
        continue;
      }

      // Use the entity's transform as the flare source position
      const worldPos = entity.transform.worldPosition.clone();

      // Compute camera vectors and alignment
      const camPos = new THREE.Vector3();
      activeCamera.getWorldPosition(camPos);
      const camForward = new THREE.Vector3();
      activeCamera.getWorldDirection(camForward);

      const toLight = worldPos.clone().sub(camPos);
      const distToLight = toLight.length();
      const alignment = toLight.length() > 0 ? camForward.dot(toLight.clone().normalize()) : -1;

      // Alignment-based visibility (0..1)
      let alignFactor = 0;
      if (alignment <= (lensComp.viewDotMin ?? -1)) alignFactor = 0;
      else if (alignment >= (lensComp.viewDotMax ?? 1)) alignFactor = 1;
      else {
        const min = lensComp.viewDotMin ?? -1;
        const max = lensComp.viewDotMax ?? 1;
        alignFactor = (alignment - min) / (max - min);
      }

      // Project to NDC and apply screen offsets
      const ndc = worldPos.clone().project(activeCamera);
      ndc.x += lensComp.screenOffsetX ?? 0;
      ndc.y += lensComp.screenOffsetY ?? 0;

      // If source projects outside NDC cube, hide
      if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1 || ndc.z < -1 || ndc.z > 1) {
        group.visible = false;
        continue;
      }
      group.visible = true;

      // Center-based fade
      const ndcDist = Math.sqrt(ndc.x * ndc.x + ndc.y * ndc.y);
      const cfStart = lensComp.centerFadeStart ?? 0;
      const cfEnd = lensComp.centerFadeEnd ?? 1.4;
      let centerFactor = 1;
      if (ndcDist <= cfStart) centerFactor = 1;
      else if (ndcDist >= cfEnd) centerFactor = 0;
      else centerFactor = 1 - (ndcDist - cfStart) / (cfEnd - cfStart);

      // Combine into base visibility
      let baseVisibility = alignFactor * centerFactor;

      // Occlusion test: if occluded, visibility -> 0
      if (lensComp.occlusionEnabled) {
        if (distToLight > 0.001) {
          const ray = new THREE.Raycaster(camPos, toLight.clone().normalize());
          (ray as any).camera = activeCamera;
          const intersects = ray.intersectObjects(this.scene.children, true);
          const srcRender = this.registry.get(entity.id);
          for (const it of intersects) {
            if (it.object instanceof THREE.Sprite) continue;

            // If the intersect belongs to the same entity (its render object), ignore it
            let belongsToSource = false;
            if (srcRender && srcRender.object3D) {
              let p: THREE.Object3D | null = it.object as THREE.Object3D | null;
              while (p) {
                if (p === srcRender.object3D) {
                  belongsToSource = true;
                  break;
                }
                p = p.parent as THREE.Object3D | null;
              }
            }
            if (belongsToSource) continue;

            if (it.distance < distToLight - 0.01) {
              baseVisibility = 0;
              break;
            }
          }
        }
      }

      const visibility = Math.max(0, Math.min(1, baseVisibility));
      const intensity = (lensComp.intensity ?? 1) * visibility;

      if (intensity <= 1e-4) {
        group.visible = false;
        continue;
      }

      // Direction from light to screen center in NDC
      let dirToCenter = new THREE.Vector2(-ndc.x, -ndc.y);
      if (dirToCenter.lengthSq() < 1e-6) dirToCenter.set(1, 0);
      // Rotate axis by axisAngleDeg
      const angleRad = ((lensComp.axisAngleDeg ?? 0) * Math.PI) / 180;
      if (Math.abs(angleRad) > 1e-6) {
        const c = Math.cos(angleRad);
        const s = Math.sin(angleRad);
        dirToCenter = new THREE.Vector2(
          dirToCenter.x * c - dirToCenter.y * s,
          dirToCenter.x * s + dirToCenter.y * c
        );
      }

      // Place sprites: child[0] is main glow, others correspond to element entries
      group.children.forEach((child, idx) => {
        if (!(child instanceof THREE.Sprite)) return;
        const sprite = child as THREE.Sprite;
        if (idx === 0) {
          // main sprite at the light's NDC
          const probe = new THREE.Vector3(ndc.x, ndc.y, 0).unproject(activeCamera);
          const dir = probe.sub(camPos).normalize();
          const fixedDist = Math.min(50, Math.max(5, distToLight * 0.5));
          const worldSpritePos = camPos.clone().add(dir.multiplyScalar(fixedDist));
          sprite.position.copy(worldSpritePos);
          sprite.quaternion.copy(activeCamera.quaternion);
          sprite.material.opacity = Math.max(0, Math.min(1, intensity));
        } else {
          const meta = (sprite as any).userData || lensComp.flareElements?.[idx - 1];
          if (!meta) return;
          const distance = meta.distance ?? 0;
          const ex = ndc.x + dirToCenter.x * distance;
          const ey = ndc.y + dirToCenter.y * distance;
          const probe = new THREE.Vector3(ex, ey, 0).unproject(activeCamera);
          const dir = probe.sub(camPos).normalize();
          const fixedDist = Math.min(50, Math.max(5, distToLight * 0.5));
          const worldSpritePos = camPos.clone().add(dir.multiplyScalar(fixedDist));
          sprite.position.copy(worldSpritePos);
          sprite.quaternion.copy(activeCamera.quaternion);
          // Scale influenced by visibility
          const baseSize = meta.size ?? (sprite.scale.x || 0.5);
          const scaleByVis = lensComp.scaleByVisibility ?? 0.5;
          const finalScale = baseSize * (1 + visibility * scaleByVis);
          sprite.scale.set(finalScale, finalScale, 1);
          const baseOpacity = meta.opacity ?? (sprite.material.opacity as number);
          sprite.material.opacity = Math.max(0, Math.min(1, baseOpacity * intensity));
        }
      });
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

  private createLensFlare(entity: Entity, lensComp: LensFlareComponent): void {
    const flareGroup = LensFlareFactory.build(lensComp);
    const rc = this.registry.get(entity.id);
    // If there's an existing render object for this entity (mesh/light/camera),
    // attach the flare as a child so we keep a single registry entry per entity.
    if (rc && rc.object3D) {
      rc.object3D.add(flareGroup);
    } else {
      // No base render object: the flare group becomes the main object for this entity
      this.syncTransformToObject3D(entity, flareGroup);
      this.scene.add(flareGroup);
      this.registry.add(entity.id, {
        entityId: entity.id,
        object3D: flareGroup,
      });
    }
  }

  private recreateLensFlare(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");

    // If there's no base render object for this entity, treat the flare as the main object
    if (!rc || !rc.object3D) {
      if (lensComp && lensComp.enabled !== false) this.createLensFlare(entity, lensComp);
      return;
    }

    // There is a base render object (mesh/light/camera). Manage the flare as a child.
    const baseObject = rc.object3D;
    const groupName = `lensflare-${lensComp?.type ?? 'lensFlare'}`;
    const existingGroup = baseObject.getObjectByName(groupName) as
      | THREE.Object3D
      | undefined;

    // If component removed or disabled: remove flare child but keep base object
    if (!lensComp || lensComp.enabled === false) {
      if (existingGroup) baseObject.remove(existingGroup);
      return;
    }

    // Component enabled: replace existing child with a rebuilt group
    if (existingGroup) baseObject.remove(existingGroup);
    const newGroup = LensFlareFactory.build(lensComp);
    baseObject.add(newGroup);
  }
}

export default RenderSyncSystem;
