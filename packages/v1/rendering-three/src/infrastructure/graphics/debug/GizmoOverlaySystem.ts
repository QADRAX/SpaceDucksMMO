// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoRenderer } from "@duckengine/core";
import { GizmoMaterialCache } from "./gizmo/GizmoMaterialCache";
import { LineGizmoDrawer } from "./gizmo/drawers/LineGizmoDrawer";
import { SphereGizmoDrawer } from "./gizmo/drawers/SphereGizmoDrawer";
import { BoxGizmoDrawer } from "./gizmo/drawers/BoxGizmoDrawer";
import { LabelGizmoDrawer } from "./gizmo/drawers/LabelGizmoDrawer";
import { GridGizmoDrawer } from "./gizmo/drawers/GridGizmoDrawer";
import { FrustumGizmoDrawer } from "./gizmo/drawers/FrustumGizmoDrawer";

export const GIZMO_LAYER = 10;

/**
 * An imperative, frame-cleared renderer for debugging and editor tools.
 * It uses object pooling to avoid GC overhead, maintaining a set of
 * Line and Mesh primitives that are shown/hidden each frame.
 * 
 * This class acts as the central Orchestrator. The actual geometry and 
 * material management is delegated to specific IGizmoDrawer instances.
 */
export class GizmoOverlaySystem implements IGizmoRenderer {
    private readonly scene: THREE.Scene;
    private readonly group = new THREE.Object3D();
    private readonly materialCache = new GizmoMaterialCache();

    // Drawers
    private readonly lineDrawer: LineGizmoDrawer;
    private readonly sphereDrawer: SphereGizmoDrawer;
    private readonly boxDrawer: BoxGizmoDrawer;
    private readonly labelDrawer: LabelGizmoDrawer;
    private readonly gridDrawer: GridGizmoDrawer;
    private readonly frustumDrawer: FrustumGizmoDrawer;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group.name = "GizmoOverlaySystem";
        this.group.layers.set(GIZMO_LAYER);
        this.scene.add(this.group);

        this.lineDrawer = new LineGizmoDrawer(this.group, this.materialCache, GIZMO_LAYER);
        this.sphereDrawer = new SphereGizmoDrawer(this.group, this.materialCache, GIZMO_LAYER);
        this.boxDrawer = new BoxGizmoDrawer(this.group, this.materialCache, GIZMO_LAYER);
        this.labelDrawer = new LabelGizmoDrawer(this.group, GIZMO_LAYER);
        this.gridDrawer = new GridGizmoDrawer(this.group, GIZMO_LAYER);
        this.frustumDrawer = new FrustumGizmoDrawer(this.group, GIZMO_LAYER);
    }

    public drawLine(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, colorHex: string = "#ffff00"): void {
        this.lineDrawer.draw(x1, y1, z1, x2, y2, z2, colorHex);
    }

    public drawSphere(x: number, y: number, z: number, radius: number, colorHex: string = "#ffff00"): void {
        this.sphereDrawer.draw(x, y, z, radius, colorHex);
    }

    public drawBox(x: number, y: number, z: number, w: number, h: number, d: number, colorHex: string = "#ffff00"): void {
        this.boxDrawer.draw(x, y, z, w, h, d, colorHex);
    }

    public drawLabel(text: string, x: number, y: number, z: number, colorHex: string = "#ffffff"): void {
        this.labelDrawer.draw(text, x, y, z, colorHex);
    }

    public drawGrid(size: number, divisions: number, colorHex: string = "#888888"): void {
        this.gridDrawer.draw(size, divisions, colorHex);
    }

    public drawFrustum(fov: number, aspect: number, near: number, far: number, x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number, colorHex: string = "#ffff00"): void {
        this.frustumDrawer.draw(fov, aspect, near, far, x, y, z, rotationX, rotationY, rotationZ, colorHex);
    }

    /**
     * Hides all currently active gizmos and resets the pool indices.
     * Should be called at the start of every frame before scripts run.
     */
    public clear(): void {
        this.lineDrawer.clear();
        this.sphereDrawer.clear();
        this.boxDrawer.clear();
        this.labelDrawer.clear();
        this.gridDrawer.clear();
        this.frustumDrawer.clear();
    }

    public dispose(): void {
        this.scene.remove(this.group);
        this.lineDrawer.dispose();
        this.sphereDrawer.dispose();
        this.boxDrawer.dispose();
        this.labelDrawer.dispose();
        this.gridDrawer.dispose();
        this.frustumDrawer.dispose();
        this.materialCache.dispose();
    }
}

