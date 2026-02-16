import * as THREE from "three";

/**
 * Best-effort normalization for UV channels coming from GLB/glTF.
 * Encapsulates logic to ensure 'uv' attribute exists and is vec2.
 */
export function normalizeGlbUvs(geometry: THREE.BufferGeometry): void {
    try {
        const g: any = geometry as any;
        if (!g?.getAttribute || !g?.setAttribute) return;

        const getUvAttr = (name: string): any => {
            try {
                return g.getAttribute(name);
            } catch {
                return undefined;
            }
        };

        const truncateToVec2 = (attr: any): THREE.BufferAttribute | undefined => {
            if (!attr) return undefined;
            const itemSize = attr.itemSize ?? 0;
            const count = attr.count ?? 0;
            if (itemSize === 2) return attr as THREE.BufferAttribute;
            if (itemSize < 2 || !count) return undefined;

            const array = attr.array as ArrayLike<number> | undefined;
            if (!array) return undefined;

            const out = new Float32Array(count * 2);
            for (let i = 0; i < count; i++) {
                out[i * 2 + 0] = (array as any)[i * itemSize + 0] ?? 0;
                out[i * 2 + 1] = (array as any)[i * itemSize + 1] ?? 0;
            }
            return new THREE.BufferAttribute(out, 2);
        };

        let uv: any = getUvAttr("uv");
        let uv2: any = getUvAttr("uv2");

        // Some pipelines may expose alternative UV names; pick first match.
        if (!uv) {
            uv =
                getUvAttr("uv0") ??
                getUvAttr("uv1") ??
                getUvAttr("TEXCOORD_0") ??
                undefined;
        }

        // If we found an alternative UV attr, remap it to `uv`.
        if (uv && !getUvAttr("uv")) {
            g.setAttribute("uv", uv);
        }

        // Re-read after potential remap.
        uv = getUvAttr("uv");
        uv2 = getUvAttr("uv2");

        // If base `uv` missing but `uv2` exists, copy uv2 -> uv.
        if (!uv && uv2) {
            try {
                g.setAttribute("uv", uv2.clone ? uv2.clone() : uv2);
            } catch {
                g.setAttribute("uv", uv2);
            }
        }

        // If `uv2` missing but `uv` exists, copy uv -> uv2 (for aoMap/lightMap).
        uv = getUvAttr("uv");
        uv2 = getUvAttr("uv2");
        if (uv && !uv2) {
            try {
                g.setAttribute("uv2", uv.clone ? uv.clone() : uv);
            } catch {
                g.setAttribute("uv2", uv);
            }
        }

        // Ensure uv/uv2 are vec2.
        const uvFixed = truncateToVec2(getUvAttr("uv"));
        if (uvFixed) g.setAttribute("uv", uvFixed);

        const uv2Fixed = truncateToVec2(getUvAttr("uv2"));
        if (uv2Fixed) g.setAttribute("uv2", uv2Fixed);

        // Fallback: generate planar UVs if still missing
        if (!getUvAttr("uv")) {
            const pos: any = getUvAttr("position");
            const count = pos?.count ?? 0;
            const itemSize = pos?.itemSize ?? 0;
            const array = pos?.array as ArrayLike<number> | undefined;

            if (count > 0 && itemSize >= 3 && array) {
                let minX = Infinity, minY = Infinity, minZ = Infinity;
                let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                for (let i = 0; i < count; i++) {
                    const x = (array as any)[i * itemSize + 0] ?? 0;
                    const y = (array as any)[i * itemSize + 1] ?? 0;
                    const z = (array as any)[i * itemSize + 2] ?? 0;
                    if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
                    if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
                }

                const dx = maxX - minX;
                const dy = maxY - minY;
                const dz = maxZ - minZ;

                type Axis = { name: string; range: number; min: number; read: (i: number) => number; };
                const axes: Axis[] = [
                    { name: "x", range: dx, min: minX, read: (i) => (array as any)[i * itemSize + 0] ?? 0 },
                    { name: "y", range: dy, min: minY, read: (i) => (array as any)[i * itemSize + 1] ?? 0 },
                    { name: "z", range: dz, min: minZ, read: (i) => (array as any)[i * itemSize + 2] ?? 0 },
                ];

                axes.sort((a, b) => (b.range ?? 0) - (a.range ?? 0));
                const uAxis = axes[0];
                const vAxis = axes[1] ?? axes[0];

                const uRange = uAxis.range || 1;
                const vRange = vAxis.range || 1;

                const out = new Float32Array(count * 2);
                for (let i = 0; i < count; i++) {
                    const u = (uAxis.read(i) - uAxis.min) / uRange;
                    const v = (vAxis.read(i) - vAxis.min) / vRange;
                    out[i * 2 + 0] = Number.isFinite(u) ? u : 0;
                    out[i * 2 + 1] = Number.isFinite(v) ? v : 0;
                }

                const uvGenerated = new THREE.BufferAttribute(out, 2);
                g.setAttribute("uv", uvGenerated);
                if (!getUvAttr("uv2")) {
                    try {
                        g.setAttribute("uv2", uvGenerated.clone());
                    } catch {
                        g.setAttribute("uv2", uvGenerated);
                    }
                }
            }
        }
    } catch {
        // best-effort only
    }
}

/**
 * Creates a GLTFLoader configured to remap texture URLs to resolved file paths.
 */
export async function createLoaderForResolved(resolved: any): Promise<any> {
    const mod: any = await import("three/addons/loaders/GLTFLoader.js");
    const loader = new mod.GLTFLoader();

    try {
        const filesMap = resolved?.files ?? {};

        loader.manager.setURLModifier((requestedUrl: string) => {
            try {
                try {
                    const u = new URL(requestedUrl, 'http://example.invalid');
                    if (u.protocol === 'http:' || u.protocol === 'https:') {
                        return requestedUrl;
                    }
                } catch { }

                const parts = requestedUrl.split(/[\\/\\?\\#]+/).filter(Boolean);
                const reqBase = parts.length ? parts[parts.length - 1] : requestedUrl;

                for (const key of Object.keys(filesMap)) {
                    try {
                        const f = filesMap[key];
                        const fname = String(f?.fileName ?? '');
                        const base = fname.split('/').pop() || fname;
                        if (base === reqBase) {
                            return String(f?.url ?? requestedUrl);
                        }
                    } catch { }
                }
                return requestedUrl;
            } catch {
                return requestedUrl;
            }
        });
    } catch { }

    return loader;
}

/**
 * Lazy-loads a standard GLTFLoader if no resolved context needed.
 */
let sharedLoader: any = null;
export async function getGltfLoader(): Promise<any> {
    if (sharedLoader) return sharedLoader;
    const mod: any = await import("three/addons/loaders/GLTFLoader.js");
    sharedLoader = new mod.GLTFLoader();
    return sharedLoader;
}
