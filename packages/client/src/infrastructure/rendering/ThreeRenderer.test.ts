import * as THREE from 'three';

// Extend mocks for EffectComposer and RenderPass
jest.mock('three/addons/postprocessing/EffectComposer.js', () => {
  return {
    EffectComposer: jest.fn().mockImplementation(() => ({
      addPass: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
    })),
  };
});

jest.mock('three/addons/postprocessing/RenderPass.js', () => {
  return {
    RenderPass: jest.fn().mockImplementation(() => ({})),
  };
});

// Extend the mock for THREE.WebGLRenderer
jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  return {
    ...originalThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      setPixelRatio: jest.fn(), // Added mock for setPixelRatio
      shadowMap: {
        enabled: false,
        type: null,
      },
      domElement: document.createElement('canvas'),
    })),
  };
});

import { ThreeRenderer } from './ThreeRenderer';
import { FpsController } from '@client/infrastructure/ui/dev/FpsController';

// Mock FpsController
jest.mock('@client/infrastructure/ui/dev/FpsController', () => {
  return {
    FpsController: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      update: jest.fn(),
      getFps: jest.fn().mockReturnValue(60),
      isRunning: jest.fn().mockReturnValue(true),
    })),
  };
});

describe('ThreeRenderer', () => {
  let container: HTMLElement;
  let fpsController: FpsController; // Declare fpsController at the top
  let renderer: ThreeRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    fpsController = new FpsController(); // Initialize fpsController
    renderer = new ThreeRenderer(fpsController as any);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize the renderer', () => {
    renderer.init(container);

    expect(container.querySelector('canvas')).toBeTruthy();
    expect(renderer).toBeTruthy();
  });

  it('should set resolution scale', () => {
    renderer.init(container);
    renderer.setResolutionScale(2);

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('should handle resizing', () => {
    renderer.init(container);

    const spy = jest.spyOn(renderer as any, 'applyResolutionScale');
    window.dispatchEvent(new Event('resize'));

    expect(spy).toHaveBeenCalled();
  });

  it('should enable and disable post-processing', () => {
    renderer.init(container);

    // Mock an active camera
    const mockCamera = new THREE.PerspectiveCamera();
    jest.spyOn(renderer, 'getActiveCamera').mockReturnValue(mockCamera);

    const composer = renderer.enablePostProcessing();
    expect(composer).toBeTruthy();

    renderer.disablePostProcessing();
    expect(renderer.getComposer()).toBeUndefined();
  });

  it('should start and stop the render loop', () => {
    renderer.init(container);

    renderer.start();
    expect((renderer as any).rafId).not.toBeNull();

    renderer.stop();
    expect((renderer as any).rafId).toBeNull();
  });

  it('should set and teardown scenes', () => {
    const mockScene = {
      setup: jest.fn(),
      teardown: jest.fn(),
    } as any;

    renderer.init(container);
    renderer.setScene(mockScene);

    expect(mockScene.setup).toHaveBeenCalled();

    renderer.setScene(mockScene);
    expect(mockScene.teardown).toHaveBeenCalled();
  });

  it('should warn if no active camera is set', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderer.init(container);
    renderer.renderFrame();

    expect(warnSpy).toHaveBeenCalledWith(
      '[ThreeRenderer] No active camera for current scene — skipping render frame.'
    );

    warnSpy.mockRestore();
  });
});