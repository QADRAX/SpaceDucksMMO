// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, SkyboxComponent, ComponentType } from "@duckengine/core";
import { CoreLogger } from "@duckengine/core";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { deferredDispose } from "../debug/DebugUtils";

export class SkyboxFeature implements RenderFeature {
    readonly name = "SkyboxFeature";

    private currentSkyboxResourceKey: string | null = null;
    private currentSkyboxTexture: THREE.Texture | THREE.CubeTexture | null = null;
    private skyboxLoadToken = 0;

    isEligible(entity: Entity): boolean {
        return !!entity.getComponent<SkyboxComponent>("skybox");
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.syncSkybox(context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "skybox") {
            this.syncSkybox(context);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        // When a skybox entity is removed, we must check if another skybox takes over
        // or if we should clear the background.
        this.syncSkybox(context);
    }

    private getDesiredSkyboxResourceKey(context: RenderContext): string | null {
        // We check all entities to see if ANY has an enabled skybox component.
        // Iterating all entities in context.
        for (const ent of context.entities.values()) {
            const entity = ent as Entity;
            const skybox = entity.getComponent<SkyboxComponent>("skybox");
            if (!skybox) continue;
            if (skybox.enabled === false) continue;
            const key = skybox.key;
            if (key && key.trim()) return key.trim();
        }
        return null;
    }

    private syncSkybox(context: RenderContext): void {
        const desiredKey = this.getDesiredSkyboxResourceKey(context);
        const scene = context.scene;

        if (!desiredKey) {
            if (this.currentSkyboxResourceKey !== null) {
                this.currentSkyboxResourceKey = null;
                this.skyboxLoadToken += 1;
            }
            if (scene.background) scene.background = null;
            if (this.currentSkyboxTexture) {
                deferredDispose(this.currentSkyboxTexture);
                this.currentSkyboxTexture = null;
            }
            return;
        }

        if (
            this.currentSkyboxResourceKey === desiredKey &&
            scene.background === this.currentSkyboxTexture
        ) {
            return;
        }

        this.currentSkyboxResourceKey = desiredKey;
        const token = (this.skyboxLoadToken += 1);
        void this.loadAndApplySkybox(desiredKey, token, context);
    }

    private async loadAndApplySkybox(
        resourceKey: string,
        token: number,
        context: RenderContext
    ): Promise<void> {
        if (!context.engineResourceResolver) return;

        const useTracker = context.isInitialLoading && context.loadingTracker;
        const taskName = `skybox:${resourceKey}`;
        if (useTracker) context.loadingTracker!.startTask(taskName);

        try {
            let resolved: any;
            try {
                resolved = await context.engineResourceResolver.resolve(resourceKey, "active");
            } catch {
                return;
            }

            if (token !== this.skyboxLoadToken) return;
            if (this.currentSkyboxResourceKey !== resourceKey) return;

            const files = (resolved && resolved.files) || {};
            const faces = ["px", "nx", "py", "ny", "pz", "nz"] as const;
            const hasCubeFaces = faces.every((k) => !!files[k]?.url);

            const nextTexture = await new Promise<THREE.Texture | THREE.CubeTexture | null>((resolve) => {
                try {
                    if (hasCubeFaces) {
                        const loader = new THREE.CubeTextureLoader();
                        const urls = faces.map((k) => files[k].url);
                        loader.load(urls, (tex: THREE.CubeTexture) => resolve(tex), undefined, () => resolve(null));
                        return;
                    }

                    const file = files.equirect ?? files.equirectangular ?? files.map ?? files.texture;
                    const url = (file && file.url) || (Object.values(files)[0] as any)?.url;
                    if (!url) return resolve(null);

                    const loader = new THREE.TextureLoader();
                    loader.load(url, (tex: THREE.Texture) => {
                        tex.mapping = THREE.EquirectangularReflectionMapping;
                        tex.needsUpdate = true;
                        resolve(tex);
                    }, undefined, () => resolve(null));
                } catch {
                    resolve(null);
                }
            });

            if (!nextTexture) return;

            // Final check: if something else became active while we were awaiting, clean up and exit.
            if (token !== this.skyboxLoadToken || this.currentSkyboxResourceKey !== resourceKey) {
                deferredDispose(nextTexture);
                return;
            }

            if (this.currentSkyboxTexture && this.currentSkyboxTexture !== nextTexture) {
                deferredDispose(this.currentSkyboxTexture);
            }

            this.currentSkyboxTexture = nextTexture;
            context.scene.background = nextTexture;
        } catch (e) {
            CoreLogger.warn("SkyboxFeature", "Load error", e);
        } finally {
            if (useTracker) context.loadingTracker!.endTask(taskName);
        }
    }
}
