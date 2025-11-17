import { SettingsService } from "@client/application/SettingsService";
import { I18nService } from "@client/application/I18nService";
import { ServerBrowserService } from "@client/application/ServerBrowserService";
import { WindowService } from "@client/application/WindowService";
import { TextureResolverService } from "@client/application/TextureResolverService";
import DevRegistry from '@client/infrastructure/ui/dev/DevRegistry';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import GameScreenManager from "@client/application/ui/GameScreenManager";

// Minimal placeholder interfaces for editor/debug services.
// These are intentionally small so other work can replace them with
// fully-typed APIs (SceneManager debug API, object factory, etc.).
export interface SceneEditor {
  getEntities?: () => any[];
  subscribeChanges?: (cb: (ev: any) => void) => void;
}

export interface ObjectFactory {
  createEntity?: (...args: any[]) => any;
}

export interface Services {
  settings: SettingsService;
  i18n: I18nService;
  serverBrowser: ServerBrowserService;
  window: WindowService;
  textureResolver: TextureResolverService;
  fpsController: FpsController;
  devRegistry: DevRegistry;
  renderingEngine: ThreeRenderer;
  navigation: GameScreenManager;
  sceneEditor?: SceneEditor;
  objectFactory?: ObjectFactory;
}

export default Services;
