import { SettingsService } from "@client/application/SettingsService";
import { I18nService } from "@client/application/I18nService";
import { ServerBrowserService } from "@client/application/ServerBrowserService";
import { WindowService } from "@client/application/WindowService";
import { TextureResolverService } from "@client/application/TextureResolverService";
import { FpsCounter } from "@client/infrastructure/ui/FpsCounter";
import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { createContext } from "preact"; // Corrected import for createContext
import { useContext } from "preact/hooks"; // Added missing import for useContext
import GameScreenManager from "@client/application/ui/GameScreenManager";

/**
 * Services interface for dependency injection
 */
export interface Services {
  settings: SettingsService;
  i18n: I18nService;
  serverBrowser: ServerBrowserService;
  window: WindowService;
  textureResolver: TextureResolverService;
  fpsCounter: FpsCounter;
  renderingEngine: ThreeRenderer;
  navigation: GameScreenManager;
}

// Create ServicesContext for dependency injection
export const ServicesContext = createContext<Services | null>(null);

// Hook to access services
export function useServices(): Services {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices must be used within a ServicesContext.Provider");
  }
  return context;
}

// Hook to access navigation service
export function useNavigation() {
  const services = useServices();
  return (services as any).navigation;
}

export default { useServices, useNavigation, ServicesContext };
