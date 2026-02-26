// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";
import type { GizmoMaterialCache } from "../GizmoMaterialCache";

export class GridGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly layer: number;

    private grids: THREE.GridHelper[] = [];
    private index = 0;

    constructor(group: THREE.Object3D, layer: number) {
        this.group = group;
        this.layer = layer;
    }

    public draw(size: number, divisions: number, colorHex: string): void {
        let grid: THREE.GridHelper;

        // We can't perfectly pool grids with varying sizes/divisions easily without recreating geometry,
        // but we can pool them if we assume they are mostly static or recreate them if mismatched.
        // For simplicity in immediate mode, if the pool has one, we'll recreate its geometry if needed.
        if (this.index < this.grids.length) {
            grid = this.grids[this.index];
            // Three.js GridHelper bakes size and divisions into the geometry.
            // If they change, we must rebuild the geometry.
            const currentGeo = grid.geometry as THREE.BufferGeometry;
            // A simple heuristic: just recreate the geometry every time if we want to be safe, 
            // or just dispose and recreate the whole helper (it's less efficient but GridHelpers are rare).
            // Let's optimize by checking if we really need to rebuild.
            // Actually, for a robust Gizmo, recreating the GridHelper is safest if size changes.
            // Since it's a debug tool, let's just recreate it if we need to.
            grid.geometry.dispose();
            grid.geometry = new THREE.GridHelper(size, divisions, colorHex, colorHex).geometry;
            (grid.material as THREE.LineBasicMaterial).color.set(colorHex);
        } else {
            grid = new THREE.GridHelper(size, divisions, colorHex, colorHex);
            grid.renderOrder = 999;
            grid.layers.set(this.layer);
            grid.material.depthTest = false;
            grid.material.depthWrite = false;
            grid.material.transparent = true;
            grid.material.opacity = 0.5;
            this.grids.push(grid);
            this.group.add(grid);
        }

        grid.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.grids[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        for (const grid of this.grids) {
            grid.geometry.dispose();
            (grid.material as THREE.Material).dispose();
            this.group.remove(grid);
        }
        this.grids = [];
        this.index = 0;
    }
}
