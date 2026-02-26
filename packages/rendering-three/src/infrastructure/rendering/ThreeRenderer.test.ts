// Mock three/webgpu before any imports that depend on it.
// WebGPURenderer is the renderer used by ThreeRenderer after the WebGPU migration.
jest.mock('three/webgpu', () => {
  const actual = jest.requireActual('three');
  const canvas = (globalThis as any).document?.createElement?.('canvas') ?? {};

  const mockRenderer = () => ({
    init: jest.fn().mockResolvedValue(undefined),
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    setPixelRatio: jest.fn(),
    clear: jest.fn(),
    setClearColor: jest.fn(),
    compileAsync: jest.fn().mockResolvedValue(undefined),
    shadowMap: { enabled: false, type: null },
    domElement: canvas,
  });

  return {
    ...actual,
    WebGPURenderer: jest.fn().mockImplementation(mockRenderer),
    PostProcessing: jest.fn().mockImplementation(() => ({
      render: jest.fn(),
      dispose: jest.fn(),
      outputNode: null,
    })),
    PCFSoftShadowMap: actual.PCFSoftShadowMap ?? 2,
  };
});

// three/tsl provides shader utilities — mock pass() as a no-op factory.
jest.mock('three/tsl', () => ({
  pass: jest.fn().mockReturnValue({ camera: null }),
}));

import * as THREE from 'three';
import { ThreeRenderer } from './ThreeRenderer';
import { NoopFpsController, type IFpsController } from '../ui/dev/FpsController';

describe('ThreeRenderer', () => {
  let container: HTMLElement;
  let fpsController: IFpsController;
  let renderer: ThreeRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    fpsController = new NoopFpsController();
    renderer = new ThreeRenderer(fpsController as any);
  });

  afterEach(() => {
    try { renderer.dispose(); } catch { }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  /**
   * Inject a synchronous mock renderer directly into the private field,
   * bypassing the async WebGPURenderer.init() call.
   * Also sets container + scene so class internals are in a ready state.
   */
  function setupMockRenderer(r: ThreeRenderer, root: HTMLElement) {
    const canvas = document.createElement('canvas');
    (r as any).renderer = {
      init: jest.fn().mockResolvedValue(undefined),
      setSize: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      setPixelRatio: jest.fn(),
      clear: jest.fn(),
      setClearColor: jest.fn(),
      compileAsync: jest.fn().mockResolvedValue(undefined),
      shadowMap: { enabled: false, type: null },
      domElement: canvas,
    };
    (r as any).scene = new THREE.Scene();
    (r as any).container = root;
    root.appendChild(canvas);
  }

  it('should be instantiated correctly', () => {
    expect(renderer).toBeTruthy();
  });

  it('should set resolution scale without throwing', () => {
    setupMockRenderer(renderer, container);
    expect(() => renderer.setResolutionScale(2)).not.toThrow();
  });

  it('should handle resize via handleResize (debounced)', () => {
    setupMockRenderer(renderer, container);

    // handleResize() is now debounced via requestAnimationFrame.
    // We verify it calls applyResolutionForAllViews (the RAF-deferred hook)
    // by running fake timers.
    jest.useFakeTimers();
    const spy = jest.spyOn(renderer as any, 'applyResolutionForAllViews');

    renderer.handleResize();

    // RAF hasn't fired yet
    expect(spy).not.toHaveBeenCalled();

    // Advance timers to trigger the RAF callback
    jest.runAllTimers();

    expect(spy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should enable and disable post-processing', () => {
    setupMockRenderer(renderer, container);

    const mockCamera = new THREE.PerspectiveCamera();
    jest.spyOn(renderer, 'getActiveCamera').mockReturnValue(mockCamera);

    const composer = renderer.enablePostProcessing();
    expect(composer).toBeTruthy();

    renderer.disablePostProcessing();
    expect(renderer.getComposer()).toBeUndefined();
  });

  it('should start and stop the render loop', () => {
    setupMockRenderer(renderer, container);

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

    setupMockRenderer(renderer, container);
    renderer.setScene(mockScene);

    expect(mockScene.setup).toHaveBeenCalled();

    renderer.setScene(mockScene);
    expect(mockScene.teardown).toHaveBeenCalled();
  });

  it('should warn if no active camera is set', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

    setupMockRenderer(renderer, container);
    renderer.renderFrame();

    expect(warnSpy).toHaveBeenCalledWith(
      '[ThreeRenderer] No active camera for current scene — skipping render frame.'
    );

    warnSpy.mockRestore();
  });

  it('should setShadows without throwing', () => {
    setupMockRenderer(renderer, container);
    expect(() => renderer.setShadows(true)).not.toThrow();
    expect(() => renderer.setShadows(false)).not.toThrow();
  });

  it('should getActiveScene return null initially', () => {
    expect(renderer.getActiveScene()).toBeNull();
  });
});
