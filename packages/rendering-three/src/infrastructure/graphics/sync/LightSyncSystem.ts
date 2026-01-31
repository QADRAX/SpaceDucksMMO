import * as THREE from "three";
import type {
  Entity,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
} from "@duckengine/ecs";
import LightFactory, {
  type AnyLightComponent,
} from "../factories/LightFactory";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { syncTransformToObject3D } from "./TransformSync";

/**
 * Handles light creation and updating for ECS entities using the new light components.
 */
export class LightSyncSystem {
  constructor(
    private readonly scene: THREE.Scene,
    private readonly registry: RenderObjectRegistry
  ) {}

  /**
   * Try to create a light for this entity.
   * Returns true if a light was created.
   */
  processLight(entity: Entity, lightComp: AnyLightComponent): boolean {
    if (!lightComp || lightComp.enabled === false) return false;

    const light = LightFactory.build(entity, lightComp, this.scene);

    light.userData = light.userData || {};
    (light.userData as any).entityId = entity.id;

    this.scene.add(light);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: light,
    });

    return true;
  }

  /**
   * Recreate light when any light component changes.
   */
  recreateLight(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const lightComp = this.getLightComponent(entity);

    if (rc?.object3D) {
      if (!lightComp || lightComp.enabled === false) {
        rc.object3D.visible = false;
        return;
      }
      this.scene.remove(rc.object3D);
      this.registry.remove(entity.id, this.scene);
    }

    if (lightComp && lightComp.enabled !== false) {
      this.processLight(entity, lightComp);
    }
  }

  /**
   * Called when transform changes; updates light transform and directional target.
   */
  syncTransform(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D) return;

    syncTransformToObject3D(entity, rc.object3D);

    if (
      rc.object3D instanceof THREE.DirectionalLight ||
      rc.object3D instanceof THREE.SpotLight
    ) {
      LightFactory.updateDirectionalTarget(rc.object3D, entity);
    }
  }

  /**
   * Helper: get whichever new light component this entity has.
   */
  private getLightComponent(entity: Entity): AnyLightComponent | undefined {
    const ambient = entity.getComponent<AmbientLightComponent>("ambientLight");
    const directional =
      entity.getComponent<DirectionalLightComponent>("directionalLight");
    const point = entity.getComponent<PointLightComponent>("pointLight");
    const spot = entity.getComponent<SpotLightComponent>("spotLight");

    return ambient ?? directional ?? point ?? spot ?? undefined;
  }
}
