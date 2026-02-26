// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";

export class FrustumGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly layer: number;

    private helpers: THREE.CameraHelper[] = [];
    private index = 0;

    constructor(group: THREE.Object3D, layer: number) {
        this.group = group;
        this.layer = layer;
    }

    public draw(fov: number, aspect: number, near: number, far: number, x: number, y: number, z: number, rotX: number, rotY: number, rotZ: number, colorHex: string): void {
        let helper: THREE.CameraHelper;

        // Create a dummy camera to feed the CameraHelper
        const dummyCam = new THREE.PerspectiveCamera(fov, aspect, near, far);
        dummyCam.position.set(x, y, z);
        dummyCam.rotation.set(rotX, rotY, rotZ);
        dummyCam.updateMatrixWorld(true);

        if (this.index < this.helpers.length) {
            helper = this.helpers[this.index];
            helper.camera = dummyCam;
            helper.update();
        } else {
            helper = new THREE.CameraHelper(dummyCam);
            helper.renderOrder = 999;
            helper.layers.set(this.layer);
            this.helpers.push(helper);
            this.group.add(helper);
        }

        // Apply color to the line materials inside the helper
        const color = new THREE.Color(colorHex);
        const mat = helper.material as THREE.LineBasicMaterial;
        mat.color.copy(color);
        mat.depthTest = false;
        mat.depthWrite = false;
        mat.transparent = true;
        mat.opacity = 0.8;

        helper.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.helpers[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        for (const helper of this.helpers) {
            helper.dispose();
            this.group.remove(helper);
        }
        this.helpers = [];
        this.index = 0;
    }
}
