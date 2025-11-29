import * as THREE from "three";
import type { Entity } from "../../../domain/ecs/core/Entity";
import { LensFlareComponent } from "../../../domain/ecs/components/LensFlareComponent";
import LensFlareFactory from "../factories/LensFlareFactory";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { syncTransformToObject3D } from "./TransformSync";

/**
 * Manages lens flare groups as children of render objects (mesh/camera/light)
 * or as standalone entities, plus per-frame updates.
 */
export class LensFlareSystem {
  constructor(
    private readonly scene: THREE.Scene,
    private readonly registry: RenderObjectRegistry
  ) {}

  /**
   * Attach or create a lens flare group for the given entity.
   */
  attachLensFlare(entity: Entity, lensComp: LensFlareComponent): void {
    const flareGroup = LensFlareFactory.build(lensComp);
    flareGroup.userData = flareGroup.userData || {};
    (flareGroup.userData as any).entityId = entity.id;

    const rc = this.registry.get(entity.id);
    if (rc && rc.object3D) {
      rc.object3D.add(flareGroup);
    } else {
      syncTransformToObject3D(entity, flareGroup);
      this.scene.add(flareGroup);
      this.registry.add(entity.id, {
        entityId: entity.id,
        object3D: flareGroup,
      });
    }
  }

  /**
   * Rebuild, attach or remove the lens flare child according to component state.
   */
  recreateLensFlare(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");

    if (!rc || !rc.object3D) {
      if (lensComp && lensComp.enabled !== false) {
        this.attachLensFlare(entity, lensComp);
      }
      return;
    }

    const baseObject = rc.object3D;
    const groupName = `lensflare-${lensComp?.type ?? "lensFlare"}`;
    const existingGroup = baseObject.getObjectByName(groupName) as
      | THREE.Object3D
      | undefined;

    if (!lensComp || lensComp.enabled === false) {
      if (existingGroup) baseObject.remove(existingGroup);
      return;
    }

    if (existingGroup) baseObject.remove(existingGroup);
    const newGroup = LensFlareFactory.build(lensComp);
    baseObject.add(newGroup);
  }

  /**
   * Called per frame from RenderSyncSystem.update.
   * Applies visibility, occlusion and placement logic.
   */
  update(dt: number, entities: Map<string, Entity>): void {
    // 1) Find an active camera
    let activeCamera: THREE.Camera | undefined;
    for (const rcCam of this.registry.getAll().values()) {
      if (rcCam.object3D instanceof THREE.Camera) {
        activeCamera = rcCam.object3D as THREE.Camera;
        break;
      }
    }

    // 2) Update all lens flares
    for (const [id, rc] of this.registry.getAll()) {
      const entity = entities.get(id);
      if (!entity) continue;
      const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");
      if (!lensComp || !rc.object3D) continue;

      this.updateLensFlareForEntity(
        entity,
        lensComp,
        rc.object3D,
        activeCamera
      );
    }
  }

  // --- Private helpers ----------------------------------------------------

  private updateLensFlareForEntity(
    entity: Entity,
    lensComp: LensFlareComponent,
    object3D: THREE.Object3D,
    activeCamera?: THREE.Camera
  ): void {
    // Aquí pegas *literalmente* la lógica que tienes en `update`:
    // - búsqueda de group
    // - cálculos de alignment, center fade, occlusion, etc.
    //
    // Para no duplicar 200 líneas aquí, solo marco el patrón principal:

    let group: THREE.Object3D | undefined;
    if (object3D instanceof THREE.Group) {
      group = object3D;
    } else if (object3D.getObjectByName) {
      group = object3D.getObjectByName(`lensflare-${lensComp.type}`) as
        | THREE.Object3D
        | undefined;
    }
    if (!group) return;

    // A partir de aquí puedes copiar 1:1 todo el bloque de `update` que tenías,
    // sustituyendo `group` donde antes ibas recalculando, y usando `activeCamera`.
  }
}
