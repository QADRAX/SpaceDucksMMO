import { render } from "preact";
import DevOverlay from "@client/infrastructure/ui/components/dev/DevOverlay";
import SceneInspectorPanel from "@client/infrastructure/ui/components/inspector/organisms/SceneInspectorPanel";
import type DevRegistry from "./DevRegistry";
import type { FpsController } from "./FpsController";
import type { Services } from "../../di/Services";
import { ServicesContext } from "@client/infrastructure/ui/hooks/useServices";
import { FpsWidget } from "../components/common";

/**
 * DevToolsBootstrap
 * Responsible for mounting the DevOverlay and registering dev widgets.
 */
export class DevToolsBootstrap {
  private root: HTMLElement;
  private devRegistry: DevRegistry;
  private fpsController: FpsController;
  private services: Services;

  constructor(
    root: HTMLElement,
    services: Services,
  ) {
    this.root = root;
    this.services = services;
    this.devRegistry = services.devRegistry;
    this.fpsController = services.fpsController;
  }

  initialize(): void {
    try {
      const overlayContainer = document.createElement("div");
      overlayContainer.className = "dev-overlay-container";
      this.root.appendChild(overlayContainer);

      // Mount DevOverlay wrapped in ServicesContext provider
      try {
        render(
          <ServicesContext.Provider value={this.services}>
            <DevOverlay registry={this.devRegistry} />
          </ServicesContext.Provider>,
          overlayContainer
        );
      } catch (e) {
        console.warn("DevOverlay render failed", e);
      }

      // Register FPS widget
      this.devRegistry.register({
        id: "fps",
        render: () => <FpsWidget controller={this.fpsController} />,
        mount: () => {},
        unmount: () => {},
      });

      // Register Scene Inspector widget
      this.devRegistry.register({
        id: "scene-inspector",
        render: () => <SceneInspectorPanel />,
        mount: () => {},
        unmount: () => {},
      });
    } catch (e) {
      // ignore DOM-less environments
    }
  }
}

export default DevToolsBootstrap;
