import GameScreenManager from './GameScreenManager';
import ScreenRouter from './ScreenRouter';
import SceneManager from '../SceneManager';
import { jest } from '@jest/globals';
import ScreenId from '../../domain/ui/ScreenId';
import SceneId from '../../domain/scene/SceneId';

jest.mock('./ScreenRouter');
jest.mock('../SceneManager');

describe('GameScreenManager', () => {
  let screenRouter: jest.Mocked<ScreenRouter>;
  let sceneManager: jest.Mocked<SceneManager>;
  let gameScreenManager: GameScreenManager;

  beforeEach(() => {
    screenRouter = {
      show: jest.fn(),
    } as unknown as jest.Mocked<ScreenRouter>;

    sceneManager = {
      switchTo: jest.fn(),
    } as unknown as jest.Mocked<SceneManager>;

    gameScreenManager = new GameScreenManager(screenRouter, sceneManager);
  });

  it('should skip transition on initial load', async () => {
    const config = {
      screenId: ScreenId.Main,
      sceneId: SceneId.MainMenu,
      name: 'Main Menu',
    };

    await gameScreenManager.navigateTo(config);

    expect(sceneManager.switchTo).toHaveBeenCalledWith('main-menu');
    expect(screenRouter.show).toHaveBeenCalledWith('main');
    expect(gameScreenManager.getCurrentScreen()).toEqual(config);
  });

  it('should perform transition after initial load', async () => {
    const config1 = {
      screenId: ScreenId.Main,
      sceneId: SceneId.MainMenu,
      name: 'Main Menu',
    };

    const config2 = {
      screenId: ScreenId.Sandbox,
      sceneId: SceneId.Sandbox,
      name: 'Sandbox',
    };

    await gameScreenManager.navigateTo(config1); // Initial load
    await gameScreenManager.navigateTo(config2); // Subsequent navigation

    expect(screenRouter.show).toHaveBeenCalledWith('sandbox');
    expect(gameScreenManager.getCurrentScreen()).toEqual(config2);
  });

  it('should notify transition callbacks during navigation', async () => {
    // First navigation to consume the initial load
    await gameScreenManager.navigateTo({
      screenId: ScreenId.Main,
      sceneId: SceneId.MainMenu,
      name: 'Main Menu',
    });

    // Register callback after initial load
    const callback = jest.fn();
    gameScreenManager.onTransition(callback);

    // Navigate to a different screen to trigger a transition
    await gameScreenManager.navigateTo({
      screenId: ScreenId.Sandbox,
      sceneId: SceneId.Sandbox,
      name: 'Sandbox',
    });

    // Verify callback was called with transition states
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, true); // Transition started
    expect(callback).toHaveBeenNthCalledWith(2, false); // Transition ended
  });

  it('should remove transition callbacks correctly', () => {
    const callback = jest.fn();
    const unsubscribe = gameScreenManager.onTransition(callback);

    // Call notifyTransition to verify callback is registered
    gameScreenManager['notifyTransition'](true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true);

    // Unsubscribe and verify callback is no longer called
    unsubscribe();
    callback.mockClear();

    gameScreenManager['notifyTransition'](false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call transition callbacks in order', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    gameScreenManager.onTransition(callback1);
    gameScreenManager.onTransition(callback2);

    gameScreenManager['notifyTransition'](true);

    expect(callback1).toHaveBeenCalledWith(true);
    expect(callback2).toHaveBeenCalledWith(true);

    gameScreenManager['notifyTransition'](false);

    expect(callback1).toHaveBeenCalledWith(false);
    expect(callback2).toHaveBeenCalledWith(false);
  });

  it('should handle callback errors gracefully', () => {
    const errorCallback = jest.fn(() => {
      throw new Error('Callback error');
    });
    const successCallback = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    gameScreenManager.onTransition(errorCallback);
    gameScreenManager.onTransition(successCallback);

    // Should not throw even if a callback throws
    expect(() => gameScreenManager['notifyTransition'](true)).not.toThrow();

    // Error callback should have been called
    expect(errorCallback).toHaveBeenCalledWith(true);
    // Console.error should have been called with the error
    expect(consoleErrorSpy).toHaveBeenCalled();
    // Success callback should still be called despite the error in the first callback
    expect(successCallback).toHaveBeenCalledWith(true);

    consoleErrorSpy.mockRestore();
  });

  it('should provide access to ScreenRouter', () => {
    const screenRouter = gameScreenManager.getScreenRouter();
    expect(screenRouter).toBeDefined();
    expect(typeof screenRouter.show).toBe('function');
  });

  it('should provide access to SceneManager', () => {
    const sceneManager = gameScreenManager.getSceneManager();
    expect(sceneManager).toBeDefined();
    expect(typeof sceneManager.switchTo).toBe('function');
  });

  it('should handle unsubscribing a callback that is not registered', () => {
    const callback = jest.fn();
    const unsubscribe = gameScreenManager.onTransition(callback);

    // First unsubscribe should work
    unsubscribe();
    
    // Second unsubscribe should not throw (callback already removed)
    expect(() => unsubscribe()).not.toThrow();

    // Verify the callback is not called after unsubscribe
    gameScreenManager['notifyTransition'](true);
    expect(callback).not.toHaveBeenCalled();
  });
});