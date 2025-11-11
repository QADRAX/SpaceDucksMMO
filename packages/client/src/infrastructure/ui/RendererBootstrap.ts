import { ThreeRenderer } from '@client/infrastructure/rendering/ThreeRenderer';
import { SceneService } from '@client/application/SceneService';
import { IpcStorage } from '@client/infrastructure/storage/IpcStorage';
import { BrowserStorage } from '@client/infrastructure/storage/BrowserStorage';
import JsonSettingsRepository from '@client/infrastructure/settings/JsonSettingsRepository';
import SettingsService from '@client/application/SettingsService';
import ServerBrowserService from '@client/application/ServerBrowserService';
import StaticServerDirectory from '@client/infrastructure/server/StaticServerDirectory';
import UiLayer from './UiLayer';
import ScreenRouter from '@client/application/ui/ScreenRouter';
import ScreenId from '@client/domain/ui/ScreenId';
import MainScreen from './screens/MainScreen';
import ServerListScreen from './screens/ServerListScreen';
import SettingsScreen from './screens/SettingsScreen';
import GraphicsController from './GraphicsController';

export class RendererBootstrap {
  start(root: HTMLElement) {
    // Prepare container for Three.js
    root.style.margin = '0';
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    root.appendChild(container);

    // Composition root for renderer + services
    const engine = new ThreeRenderer();
    const sceneService = new SceneService(engine);
    const storage = (window as any).spaceducks?.storage ? new IpcStorage() : new BrowserStorage();
    const settingsRepo = new JsonSettingsRepository(storage);
    const settingsService = new SettingsService(settingsRepo);
    const serverDirectory = new StaticServerDirectory();
    const serverBrowser = new ServerBrowserService(serverDirectory);
    // UI layer + screen router
    const uiLayer = new UiLayer(root); uiLayer.mount();
    const router = new ScreenRouter(uiLayer.getRoot());
    const gfxController = new GraphicsController(engine);

    // Register screens
    router.register(new MainScreen(id => router.show(id)));
    router.register(new ServerListScreen(id => router.show(id), serverBrowser));
    router.register(new SettingsScreen(id => router.show(id), settingsService, gfxController));
    router.show(ScreenId.Main);

    // Start rendering only after initial menu (scene in background)
    sceneService.init(container);
    // Apply initial graphics preset
    settingsService.load().then(s => {
      gfxController.setResolutionAuto();
      gfxController.setAntialias(s.graphics.antialias);
      gfxController.setShadows(s.graphics.shadows);
    }).catch(() => {/* ignore */});
    sceneService.start();
  }
}

export default RendererBootstrap;
