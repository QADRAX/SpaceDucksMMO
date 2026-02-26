// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";
import type { GizmoMaterialCache } from "../GizmoMaterialCache";

export class BoxGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly cache: GizmoMaterialCache;
    private readonly layer: number;

    private readonly geo = new THREE.BoxGeometry(1, 1, 1);
    private readonly edgesGeo = new THREE.EdgesGeometry(this.geo);

    private boxes: THREE.LineSegments[] = [];
    private index = 0;

    constructor(group: THREE.Object3D, cache: GizmoMaterialCache, layer: number) {
        this.group = group;
        this.cache = cache;
        this.layer = layer;
    }

    public draw(x: number, y: number, z: number, w: number, h: number, d: number, colorHex: string): void {
        let box: THREE.LineSegments;
        if (this.index < this.boxes.length) {
            box = this.boxes[this.index];
        } else {
            box = new THREE.LineSegments(this.edgesGeo);
            box.renderOrder = 999;
            box.layers.set(this.layer);
            this.boxes.push(box);
            this.group.add(box);
        }

        box.position.set(x, y, z);
        box.scale.set(w, h, d);
        // Use line material because it's LineSegments (EdgesGeometry)
        box.material = this.cache.getMaterial(colorHex, true);
        box.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.boxes[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        this.geo.dispose();
        this.edgesGeo.dispose();
        for (const box of this.boxes) {
            this.group.remove(box);
        }
        this.boxes = [];
        this.index = 0;
    }
}
