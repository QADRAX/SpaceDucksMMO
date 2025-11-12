import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type I18nService from "@client/application/I18nService";
import type SettingsService from "@client/application/SettingsService";
import type ServerBrowserService from "@client/application/ServerBrowserService";

/**
 * Services available through dependency injection context
 */
export interface Services {
  i18n: I18nService;
  settings: SettingsService;
  serverBrowser: ServerBrowserService;
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

export default useServices;
