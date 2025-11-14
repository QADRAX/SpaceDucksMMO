import ServiceContainer from "@client/infrastructure/di/ServiceContainer";
import RenderingBootstrap from "@client/infrastructure/rendering/RenderingBootstrap";
import UIBootstrap from "./UIBootstrap";

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

    // 3. Initialize 3D rendering engine
    const renderingBootstrap = new RenderingBootstrap(services.textureResolver, services.settings);
    renderingBootstrap.initialize(container);

    // 4. Initialize UI layer
    const uiBootstrap = new UIBootstrap(root);
    uiBootstrap.registerScreens(services, renderingBootstrap.getSceneManager());
    
    // Inject editor services
    uiBootstrap.injectEditorServices(
      services,
      renderingBootstrap.getSceneEditor(),
      renderingBootstrap.getObjectFactory()
    );
    
    // Show initial screen with transition (async but don't block)
    uiBootstrap.showInitialScreen().catch(err => {
      console.error('Failed to show initial screen:', err);
    });

    // 5. Initialize services asynchronously
    try {
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
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }

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
