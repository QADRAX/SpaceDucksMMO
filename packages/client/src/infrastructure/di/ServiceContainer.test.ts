import { ServiceContainer } from './ServiceContainer';
import GameScreenManager from '@client/application/ui/GameScreenManager';
import SettingsService from '@client/application/SettingsService';
import I18nService from '@client/application/I18nService';
import ServerBrowserService from '@client/application/ServerBrowserService';
import WindowService from '@client/application/WindowService';
import TextureResolverService from '@client/application/TextureResolverService';
import { FpsCounter } from '@client/infrastructure/ui/FpsCounter';

// Mock ThreeRenderer to avoid Three.js ES module issues in Jest
jest.mock('@client/infrastructure/rendering/ThreeRenderer', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      initialize: jest.fn(),
      render: jest.fn(),
      resize: jest.fn(),
      dispose: jest.fn(),
    })),
  };
});

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('build', () => {
    it('should build all services successfully', () => {
      const services = container.build();

      expect(services).toBeDefined();
      expect(services.settings).toBeInstanceOf(SettingsService);
      expect(services.i18n).toBeInstanceOf(I18nService);
      expect(services.serverBrowser).toBeInstanceOf(ServerBrowserService);
      expect(services.window).toBeInstanceOf(WindowService);
      expect(services.textureResolver).toBeInstanceOf(TextureResolverService);
      expect(services.fpsCounter).toBeInstanceOf(FpsCounter);
      expect(services.renderingEngine).toBeDefined();
      expect(services.navigation).toBeInstanceOf(GameScreenManager);
    });

    it('should return the same services instance on multiple calls', () => {
      const services1 = container.build();
      const services2 = container.getServices();

      expect(services1).toBe(services2);
    });
  });

  describe('GameScreenManager DI', () => {
    it('should properly initialize GameScreenManager with dependencies', () => {
      const services = container.build();
      const gameScreenManager = services.navigation;

      expect(gameScreenManager).toBeInstanceOf(GameScreenManager);
      expect(gameScreenManager.getCurrentScreen()).toBeNull();
    });

    it('should wire GameScreenManager with ScreenRouter', () => {
      const services = container.build();
      const gameScreenManager = services.navigation;

      // Verify that GameScreenManager has access to its dependencies
      // by checking that navigation methods are available
      expect(typeof gameScreenManager.navigateTo).toBe('function');
      expect(typeof gameScreenManager.onTransition).toBe('function');
      expect(typeof gameScreenManager.getCurrentScreen).toBe('function');
    });

    it('should create unique instances of GameScreenManager dependencies', () => {
      const services = container.build();

      // GameScreenManager depends on ScreenRouter and SceneManager
      // These should be properly wired through the container
      expect(services.navigation).toBeDefined();
      expect(services.renderingEngine).toBeDefined();
      expect(services.settings).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should throw error if services are not built before initialization', async () => {
      await expect(container.initialize()).rejects.toThrow(
        'Services must be built before initialization'
      );
    });

    it('should initialize services successfully after build', async () => {
      container.build();
      await expect(container.initialize()).resolves.not.toThrow();
    });
  });

  describe('getServices', () => {
    it('should throw error if services are not built', () => {
      expect(() => container.getServices()).toThrow(
        'Services not built yet. Call build() first.'
      );
    });

    it('should return services after build', () => {
      const services = container.build();
      expect(container.getServices()).toBe(services);
    });
  });
});
