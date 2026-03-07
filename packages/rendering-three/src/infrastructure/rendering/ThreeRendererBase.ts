// @ts-ignore — three/webgpu ships as ESM-only; jest.config.js handles the shim.
import * as THREE from 'three/webgpu';
import type {
    IRenderingEngine,
    IScene,
    ITextureResolver,
    IResourceLoader,
    TextureCatalogService,
    IRenderSyncSystem,
} from '@duckengine/core';
import { LoadingTracker, CoreLogger } from '@duckengine/core';
import type { IFpsController } from '../ui/dev/FpsController';
import { RenderSyncSystem } from '../graphics/sync/RenderSyncSystem';
import type { ILoadingOverlay, ILoadingOverlayFactory } from './ILoadingOverlay';
import { DefaultHtmlLoadingOverlayFactory } from '../ui/DefaultHtmlLoadingOverlay';
import type { IGizmoRenderer } from '@duckengine/core';
import { GizmoOverlaySystem } from '../graphics/debug/GizmoOverlaySystem';

// ---------------------------------------------------------------------------
// Local type aliases — three/webgpu exports these but TS types may lag behind.
// The `// @ts-ignore` above makes the import work; these aliases give us
// proper types for the fields without scattering `any` everywhere.
// ---------------------------------------------------------------------------

/** The WebGPU-based renderer from `three/webgpu`. */
export type WebGPURenderer = {
    init(): Promise<void>;
    setSize(w: number, h: number, updateStyle?: boolean): void;
    setPixelRatio(ratio: number): void;
    render(scene: THREE.Scene, camera: THREE.Camera): void;
    clear(color?: boolean, depth?: boolean, stencil?: boolean): void;
    setClearColor(color: number, alpha: number): void;
    compileAsync(scene: THREE.Scene, camera: THREE.Camera): Promise<void>;
    dispose(): void;
    domElement: HTMLCanvasElement;
    shadowMap: { enabled: boolean; type: THREE.ShadowMapType | null };
};

/** Node-based post-processing from `three/webgpu`. */
export type PostProcessing = {
    render(): void;
    dispose(): void;
    outputNode: RenderPass | null;
};

/** Return type of `pass(scene, camera)` from `three/tsl`. */
export type RenderPass = {
    camera: THREE.Camera | null;
    [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Narrowed IScene extension for the renderSyncSystem internal property.
// This is NOT part of the public IScene contract (intentionally), but we need
// it here to avoid casting to `any`.
// ---------------------------------------------------------------------------
interface ISceneWithSyncSystem extends IScene {
    renderSyncSystem?: { setIsInitialLoading(loading: boolean): void };
}

/** Options accepted by the ThreeRendererBase constructor. */
export interface ThreeRendererBaseOptions {
    /**
     * Factory used to create loading-overlay instances.
     * Inject a custom factory to replace the default HTML overlay with your own UI.
     * Defaults to {@link DefaultHtmlLoadingOverlayFactory}.
     */
    overlayFactory?: ILoadingOverlayFactory;
}

/**
 * Abstract base class for Three.js/WebGPU renderer implementations.
 *
 * Contains all logic shared between ThreeRenderer (single canvas) and
 * ThreeMultiRenderer (multi canvas): resolver wiring, scene management,
 * the RAF loop, debounced resize, initial loading flow, and the
 * loading overlay lifecycle.
 *
 * Subclasses must implement the abstract hooks listed at the bottom of this
 * file to provide their view-specific behaviour (resolution, warm-up, etc.).
 */
export abstract class ThreeRendererBase implements IRenderingEngine {
    // ─── Shared scene state ──────────────────────────────────────────────────
    protected scene!: THREE.Scene;
    protected activeIScene: ISceneWithSyncSystem | null = null;

    // ─── Loop & resize ───────────────────────────────────────────────────────
    protected rafId: number | null = null;
    private resizeRafId: number | null = null;
    protected onResizeListener?: () => void;

    // ─── Loading state ───────────────────────────────────────────────────────
    protected loadingTracker = new LoadingTracker();
    protected initialLoading = false;
    protected showLoadingOverlay = true;
    protected currentLoadingSessionId = 0;

    // ─── Quality settings ────────────────────────────────────────────────────
    protected antialias = true;
    protected shadows = true;

    // ─── External dependencies ───────────────────────────────────────────────
    protected fpsController: IFpsController;
    protected textureResolver?: ITextureResolver;
    protected textureCatalog?: TextureCatalogService;
    protected engineResourceResolver?: IResourceLoader;

    // ─── Overlay factory ─────────────────────────────────────────────────────
    private readonly overlayFactory: ILoadingOverlayFactory;
    /** Active overlay instances, one per canvas. Map key = container element. */
    private readonly overlays = new Map<HTMLElement, ILoadingOverlay>();

    constructor(fpsController: IFpsController, options?: ThreeRendererBaseOptions) {
        this.fpsController = fpsController;
        this.overlayFactory = options?.overlayFactory ?? new DefaultHtmlLoadingOverlayFactory();
    }

    // ─── Resolver API ────────────────────────────────────────────────────────

    setTextureResolver(resolver: ITextureResolver): void {
        this.textureResolver = resolver;
    }
    getTextureResolver(): ITextureResolver | undefined {
        return this.textureResolver;
    }

    setTextureCatalog(catalog: TextureCatalogService): void {
        this.textureCatalog = catalog;
    }
    getTextureCatalog(): TextureCatalogService | undefined {
        return this.textureCatalog;
    }

    setResourceLoader(loader: IResourceLoader): void {
        this.engineResourceResolver = loader;
    }
    getResourceLoader(): IResourceLoader | undefined {
        return this.engineResourceResolver;
    }

    createRenderSyncSystem(
        // `renderScene` is typed as `any` in IScene.setup() — kept here intentionally
        // because THREE.Scene is an infrastructure detail hidden from the core port.
        renderScene: unknown,
        catalog?: TextureCatalogService,
        resolver?: ITextureResolver,
        resourceLoader?: IResourceLoader,
    ): IRenderSyncSystem {
        return new RenderSyncSystem(
            renderScene,
            catalog,
            resolver,
            resourceLoader ?? this.engineResourceResolver,
            this.loadingTracker,
        );
    }

    protected gizmoRenderer?: GizmoOverlaySystem;

    createGizmoRenderer(): IGizmoRenderer | undefined {
        if (!this.scene) return undefined;
        if (!this.gizmoRenderer) {
            this.gizmoRenderer = new GizmoOverlaySystem(this.scene);
        }
        return this.gizmoRenderer;
    }

    getLoadingTracker(): LoadingTracker {
        return this.loadingTracker;
    }

    isLoading(): boolean {
        return this.initialLoading;
    }

    setLoadingOverlayEnabled(enabled: boolean): void {
        this.showLoadingOverlay = enabled;
        for (const overlay of this.overlays.values()) {
            overlay.setVisible(enabled && this.initialLoading);
        }
    }

    // ─── Camera ──────────────────────────────────────────────────────────────

    getActiveCamera(): THREE.Camera | null {
        if (!this.activeIScene?.getActiveCamera) return null;
        try {
            const ent = this.activeIScene.getActiveCamera();
            if (!ent) return null;
            const obj = this.findObjectByEntityId(ent.id);
            if (obj instanceof THREE.Camera) return obj;
            return null;
        } catch (err) {
            CoreLogger.warn(this.logPrefix, 'Error calling scene.getActiveCamera():', err);
            return null;
        }
    }

    protected findObjectByEntityId(entityId: string): THREE.Object3D | null {
        if (!this.scene) return null;
        const stack: THREE.Object3D[] = [this.scene];
        while (stack.length) {
            const obj = stack.pop()!;
            if (obj.userData?.entityId === entityId) return obj;
            for (const c of obj.children) stack.push(c);
        }
        return null;
    }

    // ─── RAF Loop ────────────────────────────────────────────────────────────

    start(): void {
        if (this.rafId !== null) return;
        const loop = () => {
            try {
                this.renderFrame();
                this.rafId = requestAnimationFrame(loop);
            } catch (err) {
                CoreLogger.error(this.logPrefix, 'Fatal loop error', err);
                this.stop();
            }
        };
        this.rafId = requestAnimationFrame(loop);
    }

    stop(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    // ─── Resize (debounced, unified) ──────────────────────────────────────────
    //
    // The window 'resize' event fires many times per second while dragging.
    // Deferring to the next animation frame ensures the layout has settled
    // (prevents clientWidth/clientHeight from returning intermediate values
    // during responsive reflow) and caps the cost to one call per frame.

    handleResize(): void {
        if (this.resizeRafId !== null) return;
        this.resizeRafId = requestAnimationFrame(() => {
            this.resizeRafId = null;
            this.applyResolutionForAllViews();
        });
    }

    /** Set up the global resize listener. Call from subclass init(). */
    protected setupResizeListener(): void {
        this.onResizeListener = () => this.handleResize();
        window.addEventListener('resize', this.onResizeListener);
    }

    /** Remove the global resize listener. Call from subclass dispose(). */
    protected teardownResizeListener(): void {
        if (this.onResizeListener) {
            window.removeEventListener('resize', this.onResizeListener);
            this.onResizeListener = undefined;
        }
        if (this.resizeRafId !== null) {
            cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = null;
        }
    }

    // ─── Quality settings ────────────────────────────────────────────────────

    async setAntialias(enabled: boolean): Promise<void> {
        if (this.antialias === enabled) return;
        this.antialias = enabled;
        // antialias is a constructor-only option on WebGPURenderer → rebuild all
        await this.reinitializeAllRenderers();
    }

    setShadows(enabled: boolean, type: THREE.ShadowMapType = THREE.PCFSoftShadowMap): void {
        this.shadows = enabled;
        this.applyAllShadows(enabled, type);
    }

    // ─── Scene management ────────────────────────────────────────────────────

    setScene(scene: IScene): void {
        this.teardownPreviousScene();
        this.activeIScene = scene as ISceneWithSyncSystem;
        this.loadingTracker.reset();

        // Set loading flag BEFORE setup() so features/textures register their
        // async tasks into the tracker immediately (avoids a race condition).
        this.initialLoading = true;
        this.loadingTracker.startTask('sceneDiscovery');
        this.activeIScene.renderSyncSystem?.setIsInitialLoading(true);

        scene.setup(this, this.scene);
        this.onActiveCameraChanged();
        this.afterSceneSetup();

        if (!this.getActiveCamera()) {
            CoreLogger.warn(this.logPrefix, 'Scene setup did not register an active camera.');
        }

        this.startInitialLoading();
    }

    private teardownPreviousScene(): void {
        if (this.activeIScene?.teardown) {
            try {
                this.activeIScene.teardown(this, this.scene);
            } catch (e) {
                CoreLogger.warn(this.logPrefix, 'Error during previous scene teardown', e);
            }
        }
        if (this.scene) this.scene.clear();
        this.teardownViewComposers();
        if (this.gizmoRenderer) {
            this.gizmoRenderer.dispose();
            this.gizmoRenderer = undefined;
        }
    }

    getActiveScene(): IScene | null {
        return this.activeIScene;
    }

    toggleFpsCounter(): void {
        if (this.fpsController.isRunning()) {
            this.fpsController.stop();
            this.fpsController.hide();
        } else {
            this.fpsController.start();
            this.fpsController.show();
        }
    }

    // ─── FPS helper ──────────────────────────────────────────────────────────

    /** Tick the FPS counter. Errors are logged, never silently swallowed. */
    protected updateFps(): void {
        try {
            this.fpsController.update();
        } catch (err) {
            CoreLogger.warn(this.logPrefix, 'fpsController.update() failed', err);
        }
    }

    // ─── Initial loading flow ─────────────────────────────────────────────────
    //
    // Session-managed so that calling setScene() a second time while the first
    // load is still in progress correctly abandons the first session.

    protected async startInitialLoading(): Promise<void> {
        const sessionId = ++this.currentLoadingSessionId;
        this.initialLoading = true;
        this.mountOverlays();

        try {
            // Discovery phase: wait 500 ms so all systems (MeshFeature, etc.) can
            // discover entities and register their async tasks in the tracker.
            await new Promise<void>((resolve) => setTimeout(resolve, 500));
            if (sessionId !== this.currentLoadingSessionId) return;

            this.loadingTracker.endTask('sceneDiscovery');
            await this.loadingTracker.waitForInitialLoad();
            if (sessionId !== this.currentLoadingSessionId) return;

            // GPU warm-up: shader compilation + hidden renders to absorb buffer/
            // texture uploads before the first visible frame.
            const camera = this.getActiveCamera();
            if (camera) {
                this.setOverlayText('Finalizing GPU textures…');
                try {
                    await this.warmupGPU(sessionId, camera);
                } catch (e) {
                    CoreLogger.warn(this.logPrefix, 'GPU Warm-up failed', e);
                }
            }
        } finally {
            // Only reset if this session is still the active one.
            if (sessionId === this.currentLoadingSessionId) {
                this.initialLoading = false;
                this.disposeOverlays();
            }
        }
    }

    // ─── Overlay management (base implementation) ─────────────────────────────
    //
    // Subclasses provide the list of containers via `getOverlayContainers()`.
    // The base class handles the full lifecycle using the injected factory.

    /** Return the HTMLElement containers that each need a loading overlay. */
    protected abstract getOverlayContainers(): HTMLElement[];

    private mountOverlays(): void {
        if (!this.showLoadingOverlay) return;
        for (const container of this.getOverlayContainers()) {
            if (this.overlays.has(container)) continue;
            const overlay = this.overlayFactory.create();
            overlay.mount(container);
            this.overlays.set(container, overlay);
        }
    }

    protected updateOverlayProgress(): void {
        const progress = this.loadingTracker.getProgress();
        for (const overlay of this.overlays.values()) {
            overlay.setProgress(progress);
        }
    }

    protected setOverlayText(text: string): void {
        for (const overlay of this.overlays.values()) {
            overlay.setText(text);
        }
    }

    private disposeOverlays(): void {
        for (const overlay of this.overlays.values()) {
            overlay.dispose();
        }
        this.overlays.clear();
    }

    // ─── Abstract contract ───────────────────────────────────────────────────
    //
    // Subclasses must provide these to wire up their view-specific state.

    /** Log prefix for console messages, e.g. 'ThreeRenderer'. */
    protected abstract get logPrefix(): string;

    /** Execute a single render frame for all managed views. */
    abstract renderFrame(): void;

    /** Called by core when the active camera entity changes. */
    abstract onActiveCameraChanged(): void;

    /** Update resolution / pixel-ratio for all managed canvases. */
    protected abstract applyResolutionForAllViews(): void;

    /** Re-create all WebGPURenderer instances (needed when antialias changes). */
    protected abstract reinitializeAllRenderers(): Promise<void>;

    /** Apply shadow map settings to all managed renderers. */
    protected abstract applyAllShadows(enabled: boolean, type: THREE.ShadowMapType): void;

    /**
     * GPU warm-up for all views: compile shaders + hidden renders.
     * Must honour early-exit when `sessionId !== this.currentLoadingSessionId`.
     */
    protected abstract warmupGPU(sessionId: number, camera: THREE.Camera): Promise<void>;

    /** React to `setScene()` to update per-view state that depends on the new scene. */
    protected abstract afterSceneSetup(): void;

    /** Clean up any view-specific post-processing composers. */
    protected abstract teardownViewComposers(): void;

    // Subclass-specific public surface
    abstract init(container: HTMLElement): Promise<void>;
    abstract setResolutionScale(scale: number): void;
    abstract setResolutionPolicy(policy: 'auto' | 'scale', scale?: number): void;
    abstract enablePostProcessing(viewId?: string): PostProcessing | undefined;
    abstract disablePostProcessing(viewId?: string): void;
    abstract getComposer(viewId?: string): PostProcessing | undefined;
    abstract dispose(): void;
}
