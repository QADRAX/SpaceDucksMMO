import { ServiceContainer } from './ServiceContainer';
import SettingsService from '@client/application/SettingsService';
import I18nService from '@client/application/I18nService';
import ServerBrowserService from '@client/application/ServerBrowserService';
import WindowService from '@client/application/WindowService';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';


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
      expect(services.fpsController).toBeInstanceOf(FpsController);
      // renderingEngine/navigation/sceneManager are provided later by RendererBootstrap
      expect(services.renderingEngine).toBeUndefined();
      expect(services.navigation).toBeUndefined();
      // keyboard input service should be available
      expect(services.keyboard).toBeDefined();
    });

    it('should return the same services instance on multiple calls', () => {
      const services1 = container.build();
      const services2 = container.getServices();

      expect(services1).toBe(services2);
    });
  });

  // GameScreenManager and rendering are provided later by RendererBootstrap

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
