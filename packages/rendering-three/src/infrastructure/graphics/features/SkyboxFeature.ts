import * as THREE from "three";
import type { Entity, SkyboxComponent, ComponentType } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";

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
            const key = (skybox as any).key as string | undefined;
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
                try {
                    this.currentSkyboxTexture.dispose();
                } catch { }
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
                    try {
                        (loader as any).setCrossOrigin?.("anonymous");
                    } catch { }
                    const urls = faces.map((k) => files[k].url);
                    loader.load(
                        urls,
                        (tex) => resolve(tex),
                        undefined,
                        () => resolve(null)
                    );
                    return;
                }

                const file = files.equirect ?? files.equirectangular ?? files.map ?? files.texture;
                const url = (file && file.url) || (Object.values(files)[0] as any)?.url;
                if (!url) return resolve(null);

                const loader = new THREE.TextureLoader();
                try {
                    (loader as any).setCrossOrigin?.("anonymous");
                } catch { }
                loader.load(
                    url,
                    (tex) => {
                        try {
                            (tex as any).mapping = (THREE as any).EquirectangularReflectionMapping;
                            tex.needsUpdate = true;
                        } catch { }
                        resolve(tex);
                    },
                    undefined,
                    () => resolve(null)
                );
            } catch {
                resolve(null);
            }
        });

        if (!nextTexture) return;
        if (token !== this.skyboxLoadToken) {
            try {
                nextTexture.dispose();
            } catch { }
            return;
        }
        if (this.currentSkyboxResourceKey !== resourceKey) {
            try {
                nextTexture.dispose();
            } catch { }
            return;
        }

        if (this.currentSkyboxTexture && this.currentSkyboxTexture !== nextTexture) {
            try {
                this.currentSkyboxTexture.dispose();
            } catch { }
        }

        this.currentSkyboxTexture = nextTexture;
        context.scene.background = nextTexture;
    }
}
