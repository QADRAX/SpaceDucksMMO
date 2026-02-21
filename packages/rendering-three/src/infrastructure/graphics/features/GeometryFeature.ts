// @ts-ignore
import * as THREE from "three/webgpu";
import type {
    Entity,
    BoxGeometryComponent,
    SphereGeometryComponent,
    PlaneGeometryComponent,
    CylinderGeometryComponent,
    ConeGeometryComponent,
    TorusGeometryComponent,
    CustomGeometryComponent,
    ComponentType,
} from "@duckengine/ecs";
import {
    GeometryFactory,
    AnyGeometryComponent,
} from "../factories/GeometryFactory";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { syncTransformToObject3D } from "../sync/TransformSync";
import { CustomGeometryLoader } from "../loaders/CustomGeometryLoader";
import { deferredDispose, deferredDisposeObject } from "../debug/DebugUtils";

export class GeometryFeature implements RenderFeature {
    readonly name = "GeometryFeature";
    private readonly customLoader = new CustomGeometryLoader();
    private readonly customGeometryRequestByEntityId = new Map<string, { key: string; requestId: number }>();

    isEligible(entity: Entity): boolean {
        const geometry = this.getGeometryComponent(entity);
        return !!geometry && geometry.enabled !== false && geometry.type !== "fullMesh";
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.createMesh(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "customGeometry") {
            this.syncCustomGeometry(entity, context);
        } else if (this.isGeometryComponent(componentType)) {
            this.recreateMesh(entity, context);
        }
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (this.isGeometryComponent(componentType)) {
            this.recreateMesh(entity, context);
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc?.object3D && rc.object3D instanceof THREE.Mesh) {
            syncTransformToObject3D(entity, rc.object3D);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc && rc.object3D) {
            context.scene.remove(rc.object3D);
            deferredDisposeObject(rc.object3D);
            context.registry.remove(entity.id, context.scene);
        }
    }

    private isGeometryComponent(type: ComponentType): boolean {
        return [
            "boxGeometry", "sphereGeometry", "planeGeometry", "cylinderGeometry",
            "coneGeometry", "torusGeometry", "customGeometry"
        ].includes(type);
    }

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

    private createMesh(entity: Entity, context: RenderContext): void {
        const geometryComp = this.getGeometryComponent(entity);
        if (!geometryComp) return;

        const geometry = GeometryFactory.build(geometryComp);

        // Use a basic default material. MaterialFeature will override this.
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geometry, material);

        this.applyShadowFlags(mesh, geometryComp);

        if (geometryComp.type === "customGeometry") {
            mesh.visible = false;
            const key = (geometryComp as unknown as CustomGeometryComponent).key;
            if (typeof key === "string" && key.trim().length > 0) {
                this.loadAndApplyCustomGeometry(entity.id, key.trim(), context);
            }
        }

        mesh.userData = mesh.userData || {};
        (mesh.userData as any).entityId = entity.id;

        syncTransformToObject3D(entity, mesh);
        context.scene.add(mesh);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: mesh,
            geometry,
            material
        });
    }

    private recreateMesh(entity: Entity, context: RenderContext): void {
        this.onDetach(entity, context);
        if (this.isEligible(entity)) {
            this.onAttach(entity, context);
        }
    }

    private applyShadowFlags(obj: THREE.Object3D, geometryComp: AnyGeometryComponent): void {
        const cast = (geometryComp as any).castShadow;
        const receive = (geometryComp as any).receiveShadow;
        obj.castShadow = typeof cast === "boolean" ? cast : false;
        obj.receiveShadow = typeof receive === "boolean" ? receive : true;
    }

    private async loadAndApplyCustomGeometry(entityId: string, transformKey: string, context: RenderContext) {
        const resolver = context.engineResourceResolver;
        if (!resolver) return;

        const prev = this.customGeometryRequestByEntityId.get(entityId);
        const requestId = (prev?.requestId ?? 0) + 1;
        this.customGeometryRequestByEntityId.set(entityId, { key: transformKey, requestId });

        try {
            const geometry = await this.customLoader.load(transformKey, resolver);

            // Defer update to avoid frame spikes if many load at once
            const current = this.customGeometryRequestByEntityId.get(entityId);
            if (!current || current.requestId !== requestId || current.key !== transformKey) return;

            const rc = context.registry.get(entityId);
            if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

            if (rc.geometry) deferredDispose(rc.geometry);

            if (geometry) {
                const mesh = rc.object3D as THREE.Mesh;
                mesh.geometry = geometry;
                rc.geometry = geometry;
                mesh.visible = true;
                mesh.userData = mesh.userData || {};
                mesh.userData.customGeometryKeyApplied = transformKey;
            }
        } catch (e) {
            console.warn("[GeometryFeature] Custom geometry load failed", e);
        }
    }

    private syncCustomGeometry(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<CustomGeometryComponent>("customGeometry");
        if (!comp) return;

        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) {
            this.recreateMesh(entity, context);
            return;
        }

        const mesh = rc.object3D;
        if (comp.enabled === false) {
            mesh.visible = false;
            return;
        }

        const key = String((comp as any).key ?? "").trim();
        if (!key) {
            mesh.visible = false;
            return;
        }

        const appliedKey = String(mesh.userData?.customGeometryKeyApplied ?? "");
        if (appliedKey === key) {
            if (mesh && (mesh as any).geometry) {
                mesh.visible = true;
            }
            return;
        }

        this.loadAndApplyCustomGeometry(entity.id, key, context);
    }
}
