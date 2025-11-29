import { SettingsService } from "@client/application/SettingsService";
import { I18nService } from "@client/application/I18nService";
import { ServerBrowserService } from "@client/application/ServerBrowserService";
import { WindowService } from "@client/application/WindowService";
import DevRegistry from "@client/infrastructure/ui/dev/DevRegistry";
import { FpsController } from "@client/infrastructure/ui/dev/FpsController";
import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import GameScreenManager from "@client/application/ui/GameScreenManager";
import { Services } from "@client/infrastructure/di/Services";

/**
 * Services interface for dependency injection
 */
// Services interface is declared in `infrastructure/di/Services` per Clean Architecture
// and imported above.

// Create ServicesContext for dependency injection
export const ServicesContext = createContext<Services | null>(null);

// Hook to access services
export function useServices(): Services {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error(
      "useServices must be used within a ServicesContext.Provider"
    );
  }
  return context;
}

// Hook to access navigation service
export function useNavigation() {
  const services = useServices();
  return {
    navigateTo: services.navigation?.navigateTo.bind(
      services.navigation
    ) as GameScreenManager["navigateTo"],
  };
}

export default { useServices, useNavigation, ServicesContext };
