// Mock UiLayer and DevOverlay to avoid DOM/CSS imports during unit tests
jest.mock('./UiLayer', () => {
  return class UiLayer {
    constructor(host: HTMLElement) {}
    mount() {}
    initializeRootApp(_gsm: any) {}
    getRoot() { return { appendChild: () => {}, } as unknown as HTMLElement; }
  };
});
jest.mock('@client/infrastructure/ui/components/dev/DevOverlay', () => ({ default: () => null }), { virtual: true });
// Mock other UI dependencies to keep import graph minimal
jest.mock('@client/application/ui/ScreenRouter', () => {
  return class ScreenRouter { constructor(_root: any) {} register() {} getRoot() { return {} } };
}, { virtual: true });
jest.mock('@client/application/ui/GameScreenManager', () => {
  return class GameScreenManager { constructor(_router: any, _sceneManager: any) {} onTransition(_cb: any) { return () => {}; } navigateTo(_s: any) { return Promise.resolve(); } };
}, { virtual: true });
jest.mock('@client/domain/ui/GameScreenRegistry', () => ({ GameScreens: { MainMenu: 'main' } }), { virtual: true });
jest.mock('./screens/MainScreen', () => {
  return class MainScreen { setServices(_s: any) {} };
}, { virtual: true });
jest.mock('./screens/SandboxScreen', () => {
  return class SandboxScreen { setServices(_s: any) {} };
}, { virtual: true });
jest.mock('./screens/EcsDemoScreen', () => {
  return class EcsDemoScreen { setServices(_s: any) {} };
}, { virtual: true });
jest.mock('preact', () => ({ h: () => null, render: () => null }), { virtual: true });
jest.mock('@client/infrastructure/ui/dev/DevRegistry', () => ({ default: class DevRegistry { register() {} } }), { virtual: true });
jest.mock('@client/infrastructure/ui/dev/FpsController', () => ({ FpsController: class FpsController { start() {} stop() {} } }), { virtual: true });
jest.mock('@client/infrastructure/ui/components/common/FpsWidget', () => ({ FpsWidget: () => null }), { virtual: true });

const UIBootstrap = require('./UIBootstrap').default as typeof import('./UIBootstrap').default;
import type Services from '../di/Services';
import type SceneManager from '@client/application/SceneManager';

// Minimal mocks for Services required fields
const makeServices = (): Services => ({
  settings: {} as any,
  i18n: {} as any,
  serverBrowser: {} as any,
  window: {} as any,
  textureResolver: {} as any,
  fpsController: {} as any,
  devRegistry: {} as any,
  renderingEngine: {} as any,
  navigation: {} as any,
  sceneEditor: undefined,
  objectFactory: undefined,
} as unknown as Services);

describe('UIBootstrap wiring', () => {
  it('registerScreens exposes sceneManager on services', () => {
    // create a DOM root using the test environment's document
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    const ui = new UIBootstrap(root);

    const services = makeServices();

    const fakeSceneManager = {} as unknown as SceneManager;

    ui.registerScreens(services, fakeSceneManager);

    expect((services as any).sceneManager).toBeDefined();
    expect((services as any).sceneManager).toBe(fakeSceneManager);
  });
});
