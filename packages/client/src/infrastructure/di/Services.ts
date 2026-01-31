import { SettingsService } from "@client/application/SettingsService";
import { I18nService } from "@client/application/I18nService";
import { ServerBrowserService } from "@client/application/ServerBrowserService";
import { WindowService } from "@client/application/WindowService";
import type { TextureCatalogService } from "@client/application/TextureCatalog";
import DevRegistry from '@client/infrastructure/ui/dev/DevRegistry';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import type { ThreeRenderer } from "@duckengine/rendering-three";
import GameScreenManager from "@client/application/ui/GameScreenManager";
import type SceneManager from '@client/application/SceneManager';
import KeyboardInputService from "@client/application/KeyboardInputService";
import MouseInputService from "@client/application/MouseInputService";

export interface Services {
  settings: SettingsService;
  i18n: I18nService;
  serverBrowser: ServerBrowserService;
  window: WindowService;
  /** Generic texture catalog (discovered from assets/textures) */
  textureCatalog: TextureCatalogService;
  fpsController: FpsController;
  devRegistry: DevRegistry;
  renderingEngine?: ThreeRenderer;
  navigation?: GameScreenManager;
  /** Centralized keyboard input for hotkeys and input handling */
  keyboard: KeyboardInputService;
  /** Centralized mouse input for pointer lock and mouse-driven controllers */
  mouse: MouseInputService;
  /** Reference to the application SceneManager so UI tooling (dev inspector) can access ECS/scene APIs */
  sceneManager?: SceneManager;
}

export default Services;
