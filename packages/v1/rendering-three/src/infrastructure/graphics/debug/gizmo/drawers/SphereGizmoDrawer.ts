// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";
import type { GizmoMaterialCache } from "../GizmoMaterialCache";

export class SphereGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly cache: GizmoMaterialCache;
    private readonly layer: number;

    private readonly geo = new THREE.SphereGeometry(1, 16, 16);
    private spheres: THREE.Mesh[] = [];
    private index = 0;

    constructor(group: THREE.Object3D, cache: GizmoMaterialCache, layer: number) {
        this.group = group;
        this.cache = cache;
        this.layer = layer;
    }

    public draw(x: number, y: number, z: number, radius: number, colorHex: string): void {
        let sphere: THREE.Mesh;
        if (this.index < this.spheres.length) {
            sphere = this.spheres[this.index];
        } else {
            sphere = new THREE.Mesh(this.geo);
            sphere.renderOrder = 999;
            sphere.layers.set(this.layer);
            this.spheres.push(sphere);
            this.group.add(sphere);
        }

        sphere.position.set(x, y, z);
        sphere.scale.setScalar(radius);
        sphere.material = this.cache.getMaterial(colorHex, false, true);
        sphere.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.spheres[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        this.geo.dispose();
        for (const sphere of this.spheres) {
            this.group.remove(sphere);
        }
        this.spheres = [];
        this.index = 0;
    }
}
