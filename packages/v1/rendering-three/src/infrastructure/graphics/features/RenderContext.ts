// @ts-ignore
import * as THREE from "three/webgpu";
import type { LoadingTracker } from "@duckengine/core";
import { RenderObjectRegistry } from "../sync/RenderObjectRegistry";
import { TextureCache } from "../factories/TextureCache";
import type { IResourceLoader } from "@duckengine/core";

/**
 * Context provided to RenderFeatures during their lifecycle.
 * Encapsulates the global state required for rendering synchronization.
 */
export interface RenderContext {
    readonly scene: THREE.Scene;
    readonly registry: RenderObjectRegistry;
    readonly textureCache: TextureCache;
    readonly loadingTracker?: LoadingTracker;
    readonly engineResourceResolver?: IResourceLoader;
    readonly entities: Map<string, any>; // Using any to avoid circular deps if Entity is used in RenderFeature which imports RenderContext
    readonly debugFlags: Record<string, boolean>;
    activeCameraEntityId: string | null;
    isInitialLoading: boolean;
}
