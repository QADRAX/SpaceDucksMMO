import * as THREE from "three";
import type {
    Entity,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    SpotLightComponent,
} from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { LightFactory, type AnyLightComponent } from "../factories/LightFactory";
import { syncTransformToObject3D } from "../sync/TransformSync";

export class LightFeature implements RenderFeature {
    readonly name = "LightFeature";

    isEligible(entity: Entity): boolean {
        return !!this.getLightComponent(entity);
    }

    onAttach(entity: Entity, context: RenderContext): void {
        const lightComp = this.getLightComponent(entity);
        if (!lightComp || lightComp.enabled === false) return;

        const light = LightFactory.build(entity, lightComp, context.scene);
        light.userData = light.userData || {};
        (light.userData as any).entityId = entity.id;

        context.scene.add(light);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: light,
        });
    }

    onUpdate(entity: Entity, componentType: string, context: RenderContext): void {
        if (
            [
                "ambientLight",
                "directionalLight",
                "pointLight",
                "spotLight",
            ].includes(componentType)
        ) {
            this.onDetach(entity, context);
            this.onAttach(entity, context);
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D) return;

        syncTransformToObject3D(entity, rc.object3D);

        if (
            rc.object3D instanceof THREE.DirectionalLight ||
            rc.object3D instanceof THREE.SpotLight
        ) {
            LightFactory.updateDirectionalTarget(rc.object3D, entity);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        context.registry.remove(entity.id, context.scene);
    }

    private getLightComponent(entity: Entity): AnyLightComponent | undefined {
        return (
            entity.getComponent<AmbientLightComponent>("ambientLight") ??
            entity.getComponent<DirectionalLightComponent>("directionalLight") ??
            entity.getComponent<PointLightComponent>("pointLight") ??
            entity.getComponent<SpotLightComponent>("spotLight")
        );
    }
}
