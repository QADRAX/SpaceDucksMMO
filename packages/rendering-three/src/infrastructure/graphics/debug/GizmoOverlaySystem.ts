// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoRenderer } from "@duckengine/core";

export const GIZMO_LAYER = 10;

/**
 * An imperative, frame-cleared renderer for debugging and editor tools.
 * It uses object pooling to avoid GC overhead, maintaining a set of
 * Line and Mesh primitives that are shown/hidden each frame.
 */
export class GizmoOverlaySystem implements IGizmoRenderer {
    private readonly scene: THREE.Scene;
    private readonly group = new THREE.Object3D();

    // Object pools
    private lines: THREE.Line[] = [];
    private lineIndex = 0;

    private spheres: THREE.Mesh[] = [];
    private sphereIndex = 0;

    private boxes: THREE.LineSegments[] = [];
    private boxIndex = 0;

    // Shared Materials
    private materials: Record<string, THREE.Material> = {};

    // Shared Geometries for Meshes (Lines are per-instance because geometry changes)
    private readonly sphereGeo = new THREE.SphereGeometry(1, 16, 16);
    private readonly boxGeo = new THREE.BoxGeometry(1, 1, 1);
    private readonly boxEdgesGeo = new THREE.EdgesGeometry(this.boxGeo);

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group.name = "GizmoOverlaySystem";
        this.group.layers.set(GIZMO_LAYER);
        this.scene.add(this.group);
    }

    private getMaterial(colorHex: string, isLine: boolean, isWireframe: boolean = false): THREE.Material {
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

    public drawLine(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, colorHex: string = "#ffff00"): void {
        let line: THREE.Line;
        if (this.lineIndex < this.lines.length) {
            line = this.lines[this.lineIndex];
        } else {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            line = new THREE.Line(geo);
            line.renderOrder = 999;
            line.layers.set(GIZMO_LAYER);
            this.lines.push(line);
            this.group.add(line);
        }

        const positions = (line.geometry as THREE.BufferGeometry).attributes.position;
        positions.setXYZ(0, x1, y1, z1);
        positions.setXYZ(1, x2, y2, z2);
        positions.needsUpdate = true;

        line.material = this.getMaterial(colorHex, true);
        line.visible = true;
        this.lineIndex++;
    }

    public drawSphere(x: number, y: number, z: number, radius: number, colorHex: string = "#ffff00"): void {
        let sphere: THREE.Mesh;
        if (this.sphereIndex < this.spheres.length) {
            sphere = this.spheres[this.sphereIndex];
        } else {
            sphere = new THREE.Mesh(this.sphereGeo);
            sphere.renderOrder = 999;
            sphere.layers.set(GIZMO_LAYER);
            this.spheres.push(sphere);
            this.group.add(sphere);
        }

        sphere.position.set(x, y, z);
        sphere.scale.setScalar(radius);
        sphere.material = this.getMaterial(colorHex, false, true);
        sphere.visible = true;
        this.sphereIndex++;
    }

    public drawBox(x: number, y: number, z: number, w: number, h: number, d: number, colorHex: string = "#ffff00"): void {
        let box: THREE.LineSegments;
        if (this.boxIndex < this.boxes.length) {
            box = this.boxes[this.boxIndex];
        } else {
            box = new THREE.LineSegments(this.boxEdgesGeo);
            box.renderOrder = 999;
            box.layers.set(GIZMO_LAYER);
            this.boxes.push(box);
            this.group.add(box);
        }

        box.position.set(x, y, z);
        box.scale.set(w, h, d);
        // Use line material because it's LineSegments (EdgesGeometry)
        box.material = this.getMaterial(colorHex, true);
        box.visible = true;
        this.boxIndex++;
    }

    /**
     * Hides all currently active gizmos and resets the pool indices.
     * Should be called at the start of every frame before scripts run.
     */
    public clear(): void {
        for (let i = 0; i < this.lineIndex; i++) this.lines[i].visible = false;
        for (let i = 0; i < this.sphereIndex; i++) this.spheres[i].visible = false;
        for (let i = 0; i < this.boxIndex; i++) this.boxes[i].visible = false;

        this.lineIndex = 0;
        this.sphereIndex = 0;
        this.boxIndex = 0;
    }

    public dispose(): void {
        this.scene.remove(this.group);
        for (const line of this.lines) line.geometry.dispose();
        this.sphereGeo.dispose();
        this.boxGeo.dispose();
        this.boxEdgesGeo.dispose();
        for (const key in this.materials) {
            this.materials[key].dispose();
        }
    }
}
