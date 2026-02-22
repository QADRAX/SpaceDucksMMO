// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, ShaderMaterialComponent, ComponentType } from "@duckengine/ecs";
import { ShaderMaterialFactory } from "../factories/ShaderMaterialFactory";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { deferredDispose } from "../debug/DebugUtils";

export class ShaderFeature implements RenderFeature {
    readonly name = "ShaderFeature";

    isEligible(entity: Entity): boolean {
        const shaderComp = entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
        return !!shaderComp && shaderComp.enabled !== false;
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.syncMaterial(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "shaderMaterial") {
            this.syncMaterial(entity, context);
        }
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "shaderMaterial") {
            this.syncMaterial(entity, context);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc?.object3D instanceof THREE.Mesh) {
            this.applyDefaultMaterial(rc.object3D);
        }
    }

    private syncMaterial(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

        const shaderComp = entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

        if (!shaderComp || shaderComp.enabled === false) {
            this.applyDefaultMaterial(rc.object3D);
            return;
        }

        const mesh = rc.object3D as THREE.Mesh;
        const currentMat = mesh.material as any;

        // Optimized sync: only rebuild if the shader itself or the set of uniform keys changed.
        // Value changes are handled by ShaderUniformUpdater without material replacement.
        const currentShaderId = currentMat?.userData?.shaderId;
        const nextShaderId = shaderComp.shaderId;
        const currentUniformKeys = currentMat?.userData?.uniformKeys || '';
        const nextUniformKeys = Object.keys(shaderComp.uniforms).sort().join(',');

        if (currentShaderId === nextShaderId && currentUniformKeys === nextUniformKeys) {
            return;
        }

        // Dispose previous material
        if (rc.material) {
            if (Array.isArray(rc.material)) rc.material.forEach((m: any) => deferredDispose(m));
            else deferredDispose(rc.material);
        }

        // Build base shader material
        const newMat = ShaderMaterialFactory.build(shaderComp, context.textureCache);

        mesh.material = newMat;
        rc.material = newMat;

        // Async resolve vertex/fragment if applicable
        if (context.engineResourceResolver) {
            const taskName = `shaderResolution:${entity.id}:${shaderComp.shaderId}`;
            context.loadingTracker?.startTask(taskName);
            ShaderMaterialFactory.resolveAndApplyShader(newMat, shaderComp, context.engineResourceResolver)
                .catch((err) => console.warn(`[ShaderFeature] Failed to resolve shader for ${entity.id}:`, err))
                .finally(() => {
                    context.loadingTracker?.endTask(taskName);
                });
        }
    }

    private applyDefaultMaterial(mesh: THREE.Mesh): void {
        if (mesh.material) {
            deferredDispose(mesh.material as any);
        }
        mesh.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }
}
