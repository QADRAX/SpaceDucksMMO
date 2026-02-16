import * as THREE from "three";
import type { Entity, CameraViewComponent } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { CameraFactory } from "../factories/CameraFactory";
import { syncTransformToObject3D } from "../sync/TransformSync";

export class CameraFeature implements RenderFeature {
    readonly name = "CameraFeature";

    isEligible(entity: Entity): boolean {
        const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
        return !!cameraView && cameraView.enabled !== false;
    }

    onAttach(entity: Entity, context: RenderContext): void {
        const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
        if (!cameraView) return;

        const camera = CameraFactory.build(cameraView);
        camera.userData = camera.userData || {};
        (camera.userData as any).entityId = entity.id;

        syncTransformToObject3D(entity, camera);
        context.scene.add(camera);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: camera,
        });
    }

    onUpdate(entity: Entity, componentType: string, context: RenderContext): void {
        if (componentType === "cameraView") {
            const rc = context.registry.get(entity.id);
            if (!rc?.object3D || !(rc.object3D instanceof THREE.PerspectiveCamera)) return;

            const cv = entity.getComponent<CameraViewComponent>("cameraView");
            if (!cv) return;

            rc.object3D.fov = cv.fov;
            rc.object3D.aspect = cv.aspect;
            rc.object3D.near = cv.near;
            rc.object3D.far = cv.far;
            rc.object3D.updateProjectionMatrix();
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Camera)) return;
        syncTransformToObject3D(entity, rc.object3D);
    }

    onDetach(entity: Entity, context: RenderContext): void {
        context.registry.remove(entity.id, context.scene);
    }
}
