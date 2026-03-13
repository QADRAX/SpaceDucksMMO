// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";
import type { GizmoMaterialCache } from "../GizmoMaterialCache";

export class LineGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly cache: GizmoMaterialCache;
    private readonly layer: number;

    private lines: THREE.Line[] = [];
    private index = 0;

    constructor(group: THREE.Object3D, cache: GizmoMaterialCache, layer: number) {
        this.group = group;
        this.cache = cache;
        this.layer = layer;
    }

    public draw(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, colorHex: string): void {
        let line: THREE.Line;
        if (this.index < this.lines.length) {
            line = this.lines[this.index];
        } else {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            line = new THREE.Line(geo);
            line.renderOrder = 999;
            line.layers.set(this.layer);
            this.lines.push(line);
            this.group.add(line);
        }

        const positions = (line.geometry as THREE.BufferGeometry).attributes.position;
        positions.setXYZ(0, x1, y1, z1);
        positions.setXYZ(1, x2, y2, z2);
        positions.needsUpdate = true;

        line.material = this.cache.getMaterial(colorHex, true);
        line.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.lines[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        for (const line of this.lines) {
            line.geometry.dispose();
            this.group.remove(line);
        }
        this.lines = [];
        this.index = 0;
    }
}
