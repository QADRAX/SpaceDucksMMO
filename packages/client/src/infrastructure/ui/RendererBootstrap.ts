import { ThreeRenderer } from '@client/infrastructure/rendering/ThreeRenderer';
import { SceneService } from '@client/application/SceneService';
import { IpcStorage } from '@client/infrastructure/storage/IpcStorage';
import { BrowserStorage } from '@client/infrastructure/storage/BrowserStorage';
import JsonSettingsRepository from '@client/infrastructure/settings/JsonSettingsRepository';
import SettingsService from '@client/application/SettingsService';
import { MenuController, MenuState } from '@client/application/MenuController';
import ServerBrowserService from '@client/application/ServerBrowserService';
import StaticServerDirectory from '@client/infrastructure/server/StaticServerDirectory';
import { defaultGameSettings } from '@client/domain/settings/GameSettings';

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
    const menu = new MenuController();

    // Basic UI scaffolding (no framework yet)
    const uiRoot = document.createElement('div');
    uiRoot.style.position = 'absolute';
    uiRoot.style.top = '0';
    uiRoot.style.left = '0';
    uiRoot.style.padding = '8px';
    uiRoot.style.fontFamily = 'sans-serif';
    uiRoot.style.color = '#eee';
    uiRoot.style.zIndex = '10';
    root.appendChild(uiRoot);

    const renderMenu = (state: MenuState) => {
      uiRoot.innerHTML = '';
      if (state === MenuState.MAIN) {
        const title = document.createElement('h3');
        title.textContent = 'SpaceDucks - Main Menu';
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Servers';
        playBtn.onclick = () => menu.go(MenuState.SERVER_LIST);
        const settingsBtn = document.createElement('button');
        settingsBtn.textContent = 'Settings';
        settingsBtn.onclick = () => menu.go(MenuState.SETTINGS);
        uiRoot.append(title, playBtn, settingsBtn);
      } else if (state === MenuState.SERVER_LIST) {
        const back = document.createElement('button');
        back.textContent = '< Back';
        back.onclick = () => menu.go(MenuState.MAIN);
        const listTitle = document.createElement('h4');
        listTitle.textContent = 'Servers';
        uiRoot.append(back, listTitle);
        serverBrowser.withLatency().then(servers => {
          servers.forEach(s => {
            const item = document.createElement('div');
            item.textContent = `${s.name} (${s.region}) - ${s.pingMs ?? '?'}ms`;
            uiRoot.appendChild(item);
          });
        });
      } else if (state === MenuState.SETTINGS) {
        const back = document.createElement('button');
        back.textContent = '< Back';
        back.onclick = () => menu.go(MenuState.MAIN);
        const stTitle = document.createElement('h4');
        stTitle.textContent = 'Settings';
        uiRoot.append(back, stTitle);
        settingsService.load().then(s => {
          const resScale = document.createElement('input');
          resScale.type = 'range';
          resScale.min = '0.5';
          resScale.max = '2';
          resScale.step = '0.1';
          resScale.value = String((s as any).graphics.resolutionScale);
          const label = document.createElement('label');
          label.textContent = `Resolution Scale: ${resScale.value}`;
          resScale.oninput = () => {
            label.textContent = `Resolution Scale: ${resScale.value}`;
          };
          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.onclick = () => {
            s.graphics.resolutionScale = parseFloat(resScale.value);
            settingsService.save(s);
          };
          uiRoot.append(label, resScale, saveBtn);
        }).catch(() => {
          settingsService.save(defaultGameSettings);
        });
      }
    };

    menu.onChange(renderMenu);
    renderMenu(menu.getState());

    // Start rendering only after initial menu (scene in background)
    sceneService.init(container);
    sceneService.start();
  }
}

export default RendererBootstrap;
