import ServiceContainer from "@client/infrastructure/di/ServiceContainer";
import RenderingBootstrap from "@client/infrastructure/rendering/RenderingBootstrap";
import UIBootstrap from "./UIBootstrap";
import DevToolsBootstrap from './dev/DevToolsBootstrap';
import { setInputServices } from "@duckengine/rendering-three/ecs";
import { createWebCoreEngineResourceResolver } from "@duckengine/rendering-three";

/**
 * Renderer Bootstrap - Main Application Orchestrator
 * 
 * Coordinates the initialization of:
 * - Services (via ServiceContainer)
 * - 3D Rendering Engine (via RenderingBootstrap)  
 * - UI Layer (via UIBootstrap)
 * 
 */
export class RendererBootstrap {
  async start(root: HTMLElement): Promise<void> {
    // 1. Prepare rendering container
    const container = this.prepareContainer(root);

    // 2. Build and initialize services (Composition Root)
    const serviceContainer = new ServiceContainer();
    const services = serviceContainer.build();

    // Expose input services globally for runtime systems/components.
    setInputServices({ mouse: services.mouse, keyboard: services.keyboard });

    // 3. Initialize 3D rendering engine
    const renderingBootstrap = new RenderingBootstrap(services.settings, services.fpsController);
    // Texture catalog is required in Services; wire it into renderer unconditionally
    renderingBootstrap.getRenderer().setTextureCatalog(services.textureCatalog);

    // Optional: resolve runtime resources (e.g. customMesh GLBs) from web-core.
    try {
      const baseUrl =
        ((import.meta as any).env?.VITE_WEB_CORE_BASE_URL as string | undefined) ??
        'http://localhost:3000';
      if (typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
        renderingBootstrap
          .getRenderer()
          .setEngineResourceResolver(
            createWebCoreEngineResourceResolver({ baseUrl: baseUrl.trim() })
          );
      }
    } catch {
      // ignore
    }
    await renderingBootstrap.initialize(container);

    // Expose single renderer and scene manager instances from RenderingBootstrap into services
    const sceneManager = renderingBootstrap.getSceneManager();
    const renderer = renderingBootstrap.getRenderer();
    services.sceneManager = sceneManager;
    services.renderingEngine = renderer;

    // Wire canvas element into mouse service when available
    const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      services.mouse.setTargetElement(canvas);
      canvas.addEventListener('click', () => services.mouse.requestPointerLock());
    }

    // Always allow Escape to exit pointer lock
    services.keyboard.onKeyDown('escape', () => {
      services.mouse.exitPointerLock();
    });

    // 4. Initialize UI layer
    const uiBootstrap = new UIBootstrap(root);
    uiBootstrap.registerScreens(services, sceneManager);
    
    // Initialize dev tools (overlay + widget registration) in development
    if (process.env.NODE_ENV !== 'production') {
      // Initialize dev tools only when required services are present (no try/catch)
      if (root && services.devRegistry && services.keyboard && typeof services.keyboard.onKeyDown === 'function') {
        const devTools = new DevToolsBootstrap(root, services);
        devTools.initialize();

        // Register dev hotkeys via centralized KeyboardInputService
        services.keyboard.onKeyDown('f1', () => {
          const mounted = services.devRegistry.toggleWidget('fps');
          if (mounted) services.fpsController.start(); else services.fpsController.stop();
        });

        services.keyboard.onKeyDown('f2', () => {
          services.devRegistry.toggleWidget('scene-inspector');
        });
      }
    }
    
    // Show initial screen with transition (async but don't block)
    uiBootstrap.showInitialScreen().catch(err => {
      console.error('Failed to show initial screen:', err);
    });

    // 5. Initialize services asynchronously and apply initial settings
    await serviceContainer.initialize();
    // Apply initial graphics settings
    const settings = services.settings.getSettings();
    renderingBootstrap.applySettings(settings);

    // Apply initial fullscreen state
    await services.window.setFullscreen(settings.graphics.fullscreen);

    // Subscribe to settings changes for real-time updates
    const gfxController = renderingBootstrap.getGraphicsController();
    services.settings.subscribe((newSettings) => {
      gfxController.setAntialias(newSettings.graphics.antialias);
      gfxController.setShadows(newSettings.graphics.shadows);
      // Apply fullscreen changes immediately
      services.window.setFullscreen(newSettings.graphics.fullscreen);
    });

    // 6. Start render loop
    renderingBootstrap.start();
  }

  /**
   * Prepare container for Three.js rendering
   */
  private prepareContainer(root: HTMLElement): HTMLElement {
    root.style.margin = "0";
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    root.appendChild(container);
    return container;
  }
}

export default RendererBootstrap;
