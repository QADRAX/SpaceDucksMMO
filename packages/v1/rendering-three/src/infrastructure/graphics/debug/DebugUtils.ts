import * as THREE from "three";

export interface Disposable {
    dispose(): void;
}

/**
 * Defers the disposal of a resource by a few frames.
 * Useful in WebGPU to avoid "buffer used while destroyed" errors when
 * resources are disposed while still in flight for the GPU.
 */
export function deferredDispose(item: Disposable | undefined | null, frames = 6): void {
    if (!item || typeof item.dispose !== 'function') return;

    let count = 0;
    const tick = () => {
        count++;
        if (count >= frames) {
            try {
                item.dispose();
            } catch {
                // Ignore errors during disposal
            }
        } else {
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(tick);
            } else {
                // Fallback for non-browser environments
                setTimeout(tick, 16);
            }
        }
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(tick);
    } else {
        setTimeout(tick, 16);
    }
}

/**
 * Recursively disposes all geometries and materials in an Object3D,
 * using deferred disposal.
 * 
 * NOTE: For Sprites, we avoid disposing geometry because they share a
 * global singleton BufferGeometry in Three.js.
 */
export function deferredDisposeObject(obj: THREE.Object3D, frames = 6): void {
    obj.traverse((o: any) => {
        // Sprite geometry is a shared singleton in Three.js; DO NOT dispose it.
        if (o.geometry && !o.isSprite) {
            deferredDispose(o.geometry, frames);
        }

        if (o.material) {
            const materials = Array.isArray(o.material) ? o.material : [o.material];
            materials.forEach((m: any) => {
                // Dispose the material itself
                deferredDispose(m, frames);

                // Thoroughly dispose any textures found on the material
                if (m.map) deferredDispose(m.map, frames);
                if (m.lightMap) deferredDispose(m.lightMap, frames);
                if (m.aoMap) deferredDispose(m.aoMap, frames);
                if (m.emissiveMap) deferredDispose(m.emissiveMap, frames);
                if (m.bumpMap) deferredDispose(m.bumpMap, frames);
                if (m.normalMap) deferredDispose(m.normalMap, frames);
                if (m.displacementMap) deferredDispose(m.displacementMap, frames);
                if (m.roughnessMap) deferredDispose(m.roughnessMap, frames);
                if (m.metalnessMap) deferredDispose(m.metalnessMap, frames);
                if (m.alphaMap) deferredDispose(m.alphaMap, frames);
                if (m.envMap) deferredDispose(m.envMap, frames);
            });
        }

        // Additional maps that might be attached directly to the object (uncommon but possible in some rigs)
        if (o.map) {
            deferredDispose(o.map, frames);
        }
    });
}
