// @ts-ignore
import * as THREE from "three/webgpu";

/**
 * Common interface for all imperative gizmo shapes.
 * Handles pooling, updating, and hiding its specific type of 3D primitive.
 */
export interface IGizmoDrawer {
    /**
     * Hide all active primitives. Called at the start of each frame.
     */
    clear(): void;

    /**
     * Completely destroy geometries, materials, and internal pools.
     */
    dispose(): void;
}
