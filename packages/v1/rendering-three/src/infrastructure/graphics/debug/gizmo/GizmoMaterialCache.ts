// @ts-ignore
import * as THREE from "three/webgpu";

/**
 * Shared material caching system for Gizmos.
 * Prevents allocating hundreds of identical LineBasic or MeshBasic materials 
 * for common colors like red, green, or yellow.
 */
export class GizmoMaterialCache {
    private materials: Record<string, THREE.Material> = {};

    public getMaterial(colorHex: string, isLine: boolean, isWireframe: boolean = false): THREE.Material {
        const key = `${colorHex}-${isLine}-${isWireframe}`;
        if (!this.materials[key]) {
            const color = new THREE.Color(colorHex);
            if (isLine) {
                this.materials[key] = new THREE.LineBasicMaterial({
                    color,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true,
                    opacity: 0.8
                });
            } else {
                this.materials[key] = new THREE.MeshBasicMaterial({
                    color,
                    wireframe: isWireframe,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true,
                    opacity: 0.8
                });
            }
        }
        return this.materials[key];
    }

    public dispose(): void {
        for (const key in this.materials) {
            this.materials[key].dispose();
        }
        this.materials = {};
    }
}
