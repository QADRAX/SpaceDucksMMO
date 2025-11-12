import { ThreeRenderer } from "@client/infrastructure/rendering/ThreeRenderer";
import { SceneService } from "@client/application/SceneService";
import SceneManager from "@client/application/SceneManager";
// IPC-backed storage bridge for renderer
import { BrowserStorage } from "@client/infrastructure/storage/BrowserStorage";
import JsonSettingsRepository from "@client/infrastructure/settings/JsonSettingsRepository";
import SettingsService from "@client/application/SettingsService";
import ServerBrowserService from "@client/application/ServerBrowserService";
import PersistentServerDirectory from "@client/infrastructure/server/PersistentServerDirectory";
import IpcStorage from "@client/infrastructure/storage/IpcStorage";
import UiLayer from "./UiLayer";
import ScreenRouter from "@client/application/ui/ScreenRouter";
import ScreenId from "@client/domain/ui/ScreenId";
import MainScreen from "./screens/MainScreen";
import GraphicsController from "./GraphicsController";
import MainMenuScene from "../scenes/MainMenuScene";
import GameWorldScene from "../scenes/GameWorldScene";
import SceneId from "@client/domain/scene/SceneId";

export class RendererBootstrap {
  start(root: HTMLElement) {
    // Prepare container for Three.js
    root.style.margin = "0";
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    root.appendChild(container);

    // Composition root for renderer + services
    const engine = new ThreeRenderer();
    const sceneManager = new SceneManager(engine);
    const sceneService = new SceneService(engine, sceneManager);

    const storage = (window as any).spaceducks?.storage
      ? new IpcStorage()
      : new BrowserStorage();
    const settingsRepo = new JsonSettingsRepository(storage);
    const settingsService = new SettingsService(settingsRepo);
    // Persistent server directory (stored in user data via IPC/FileStorage)
    const serverStorage = new IpcStorage();
    const serverDirectory = new PersistentServerDirectory(serverStorage);
    const serverBrowser = new ServerBrowserService(serverDirectory);

    // UI layer + screen router
    const uiLayer = new UiLayer(root);
    uiLayer.mount();
    const router = new ScreenRouter(uiLayer.getRoot());
    const gfxController = new GraphicsController(engine);

    // Register 3D scenes
    sceneManager.register(new MainMenuScene());
    sceneManager.register(new GameWorldScene());

    // Register UI screens with scene switching callbacks
    // Create MainScreen and inject serverBrowser instance (assign after construction to avoid TS ctor signature issues)
    const mainScreen = new MainScreen((id) => {
      router.show(id);
      if (id === ScreenId.Main) sceneManager.switchTo(SceneId.MainMenu);
    });
    // inject service (cast to any to set private field)
    (mainScreen as any).serverBrowser = serverBrowser;
    router.register(mainScreen);

    // Initialize rendering engine FIRST (creates Three.js scene, camera, renderer)
    sceneService.init(container);

    // NOW we can switch to the initial scene (needs engine initialized)
    sceneManager.switchTo(SceneId.MainMenu);

    // Show main menu UI
    router.show(ScreenId.Main);

    // Apply initial graphics preset
    settingsService
      .load()
      .then((s) => {
        gfxController.setResolutionAuto();
        gfxController.setAntialias(s.graphics.antialias);
        gfxController.setShadows(s.graphics.shadows);
      })
      .catch(() => {
        /* ignore */
      });

    // Start render loop
    sceneService.start();
  }
}

export default RendererBootstrap;
