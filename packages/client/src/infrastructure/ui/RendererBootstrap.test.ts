/**
 * Tests for RendererBootstrap wiring: ensures RenderingBootstrap instances
 * are exposed into services and dev hotkeys are registered.
 */

jest.mock('@client/infrastructure/rendering/RenderingBootstrap', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    getSceneManager: jest.fn(() => ({ id: 'scene-manager' })),
    getRenderer: jest.fn(() => ({ id: 'renderer' })),
    getGraphicsController: jest.fn(() => ({ setAntialias: jest.fn(), setShadows: jest.fn(), setResolutionAuto: jest.fn() })),
    applySettings: jest.fn(),
    start: jest.fn(),
  }));
});

let capturedServices: any = null;

jest.mock('./UIBootstrap', () => {
  return jest.fn().mockImplementation(() => ({
    registerScreens: (services: any) => {
      // capture services for assertions and provide navigation
      capturedServices = services;
      services.navigation = { id: 'nav' };
    },
    showInitialScreen: jest.fn().mockResolvedValue(undefined),
  }));
});

import { RendererBootstrap } from './RendererBootstrap';

describe('RendererBootstrap wiring', () => {
  it('attaches renderer and sceneManager to services and registers hotkeys', async () => {
    const rb = new RendererBootstrap();
    const root = document.createElement('div');

    await rb.start(root);

    expect(capturedServices).toBeTruthy();
    expect(capturedServices.sceneManager).toBeDefined();
    expect(capturedServices.renderingEngine).toBeDefined();
    expect(capturedServices.navigation).toBeDefined();

    // Spy on toggleWidget and simulate hotkey presses
    const spy = jest.spyOn(capturedServices.devRegistry, 'toggleWidget');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }));
    expect(spy).toHaveBeenCalledWith('fps');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
    expect(spy).toHaveBeenCalledWith('scene-inspector');
  });
});
