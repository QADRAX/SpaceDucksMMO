import * as THREE from "three";
import type { IResourceLoader } from "@duckengine/core";
import { normalizeGlbUvs, createLoaderForResolved } from "./glTFHelpers";

export interface FullGltfResult {
    root: THREE.Object3D;
    animations: THREE.AnimationClip[];
}

export class FullGltfLoader {
    constructor() { }

    async load(resourceKey: string, resolver?: IResourceLoader): Promise<FullGltfResult | null> {
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

        const loader = await createLoaderForResolved(resolved);
        const gltf = await loader.loadAsync(url);

        // Normalize UVs on all geometries
        gltf.scene.traverse((obj: THREE.Object3D) => {
            const anyObj: any = obj;
            const geom = anyObj.geometry as THREE.BufferGeometry | undefined;
            if (geom instanceof THREE.BufferGeometry) {
                normalizeGlbUvs(geom);
            }
        });

        return {
            root: gltf.scene,
            animations: gltf.animations || []
        };
    }
}
