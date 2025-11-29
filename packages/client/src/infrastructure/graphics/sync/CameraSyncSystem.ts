import * as THREE from "three";
import type { Entity } from "../../../domain/ecs/core/Entity";
import { CameraViewComponent } from "../../../domain/ecs/components/CameraViewComponent";
import { CameraFactory } from "../factories/CameraFactory";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { syncTransformToObject3D } from "./TransformSync";

/**
 * Handles camera creation and parameter syncing for ECS entities.
 */
export class CameraSyncSystem {
  constructor(
    private readonly scene: THREE.Scene,
    private readonly registry: RenderObjectRegistry
  ) {}

  /**
   * Try to create a camera for this entity.
   * Returns true if a camera was created.
   */
  processCamera(entity: Entity, cameraView: CameraViewComponent): boolean {
    if (!cameraView || cameraView.enabled === false) return false;

    const camera = CameraFactory.build(cameraView);
    camera.userData = camera.userData || {};
    (camera.userData as any).entityId = entity.id;

    syncTransformToObject3D(entity, camera);
    this.scene.add(camera);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: camera,
    });

    return true;
  }

  /**
   * Sync camera projection parameters when CameraViewComponent changes.
   */
  syncCamera(entity: Entity): void {
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

  /**
   * Called when transform changes; keep camera transform in sync.
   */
  syncTransform(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Camera)) return;
    syncTransformToObject3D(entity, rc.object3D);
  }

  /**
   * Retrieve camera for external use (e.g. renderer).
   */
  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.registry.get(entityId);
    return rc?.object3D instanceof THREE.Camera
      ? (rc.object3D as THREE.Camera)
      : undefined;
  }
}
