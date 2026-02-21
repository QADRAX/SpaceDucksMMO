// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, CameraViewComponent, ComponentType } from "@duckengine/ecs";
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
        camera.userData.entityId = entity.id;

        syncTransformToObject3D(entity, camera);
        context.scene.add(camera);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: camera,
        });
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "cameraView") {
            const rc = context.registry.get(entity.id);
            if (!rc?.object3D || !(rc.object3D instanceof THREE.PerspectiveCamera)) return;

            const cv = entity.getComponent<CameraViewComponent>("cameraView");
            if (!cv) return;

            const cam = rc.object3D as THREE.PerspectiveCamera;
            cam.fov = cv.fov;
            cam.aspect = cv.aspect;
            cam.near = cv.near;
            cam.far = cv.far;
            cam.updateProjectionMatrix();
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
