import * as THREE from "three";
import type { EngineResourceResolver } from "../../resources/EngineResourceResolver";
import { normalizeGlbUvs, createLoaderForResolved, getGltfLoader } from "./glTFHelpers";

export class CustomGeometryLoader {
    private readonly cacheByUrl = new Map<string, Promise<THREE.BufferGeometry>>();

    constructor() { }

    async load(resourceKey: string, resolver?: EngineResourceResolver): Promise<THREE.BufferGeometry | null> {
        if (!resolver) return null;

        let resolved: any;
        try {
            resolved = await resolver.resolve(resourceKey, "active");
        } catch {
            return null;
        }

        const meshFile = resolved?.files?.mesh;
        const url = meshFile?.url;

        if (typeof url !== "string" || !url.length) return null;

        let promise = this.cacheByUrl.get(url);
        if (!promise) {
            promise = this.loadInternal(url, resolved);
            this.cacheByUrl.set(url, promise);
        }

        try {
            const geometry = await promise;
            return geometry.clone();
        } catch (e) {
            console.warn(`[CustomGeometryLoader] Failed to load geometry for key ${resourceKey}`, e);
            this.cacheByUrl.delete(url);
            return null;
        }
    }

    private async loadInternal(url: string, resolved: any): Promise<THREE.BufferGeometry> {
        const loader = resolved ? await createLoaderForResolved(resolved) : await getGltfLoader();

        const gltf = await loader.loadAsync(url);

        let found: THREE.Mesh | null = null;
        gltf.scene.traverse((obj: THREE.Object3D) => {
            if (found) return;
            if ((obj as any).isMesh) {
                found = obj as THREE.Mesh;
            }
        });

        if (!found) {
            throw new Error("GLB did not contain a mesh");
        }

        const geometry = (found as any).geometry as THREE.BufferGeometry;
        if (!(geometry instanceof THREE.BufferGeometry)) {
            throw new Error("GLB mesh did not contain a BufferGeometry");
        }

        // Normalize normals
        try {
            if (!geometry.getAttribute("normal")) {
                geometry.computeVertexNormals();
                (geometry as any).normalizeNormals?.();
            }
        } catch { }

        // Normalize bounds
        try {
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
        } catch { }

        // Normalize UVs
        normalizeGlbUvs(geometry);

        return geometry;
    }
}
