// @ts-ignore
import * as THREE from "three/webgpu";
import type { ITextureResolver, TextureCatalogService, LoadingTracker } from "@duckengine/core";
import { RenderObjectRegistry } from "../sync/RenderObjectRegistry";
import { TextureCache } from "../factories/TextureCache";
import type { EngineResourceResolver } from "../../resources/EngineResourceResolver";

/**
 * Context provided to RenderFeatures during their lifecycle.
 * Encapsulates the global state required for rendering synchronization.
 */
export interface RenderContext {
    readonly scene: THREE.Scene;
    readonly registry: RenderObjectRegistry;
    readonly textureCache: TextureCache;
    readonly loadingTracker?: LoadingTracker;
    readonly textureCatalog?: TextureCatalogService;
    readonly textureResolver?: ITextureResolver;
    readonly engineResourceResolver?: EngineResourceResolver;
    readonly entities: Map<string, any>; // Using any to avoid circular deps if Entity is used in RenderFeature which imports RenderContext
    readonly debugFlags: {
        transform: boolean;
        mesh: boolean;
        collider: boolean;
    };
    activeCameraEntityId: string | null;
    isInitialLoading: boolean;
}
