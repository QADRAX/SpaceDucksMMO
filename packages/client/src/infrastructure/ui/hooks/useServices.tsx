import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type I18nService from "../../../application/I18nService";
import type SettingsService from "../../../application/SettingsService";
import type ServerBrowserService from "../../../application/ServerBrowserService";
import type WindowService from "../../../application/WindowService";
import type TextureResolverService from "../../../application/TextureResolverService";
import type GameScreenManager from "../../../application/ui/GameScreenManager";
import type { GameScreenConfig } from "../../../domain/ui/GameScreen";

/**
 * Services available through dependency injection context
 */
export interface Services {
  i18n: I18nService;
  settings: SettingsService;
  serverBrowser: ServerBrowserService;
  window: WindowService;
  textureResolver: TextureResolverService;
  navigation?: GameScreenManager; // Injected later in UIBootstrap
}

// Context for services
export const ServicesContext = createContext<Services | null>(null);

/**
 * Hook to access application services in components
 */
export function useServices(): Services {
  const services = useContext(ServicesContext);
  
  if (!services) {
    throw new Error("useServices must be used within ServicesContext.Provider");
  }

  return services;
}

/**
 * Hook to access navigation service
 * Convenience hook for navigating between game screens
 */
export function useNavigation() {
  const services = useServices();
  
  if (!services.navigation) {
    throw new Error("Navigation service not initialized yet");
  }
  
  return {
    navigateTo: async (config: GameScreenConfig) => await services.navigation!.navigateTo(config),
    getCurrentScreen: () => services.navigation!.getCurrentScreen(),
  };
}
