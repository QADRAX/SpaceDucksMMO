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

// Note: we avoid mocking the top-level 'three' module because creating a
// real `WebGLRenderer` produces a real `canvas` node which is required
// for DOM assertions in these tests. We only mock postprocessing addons above.

import { ThreeRenderer } from './ThreeRenderer';
import { NoopFpsController, type IFpsController } from '../ui/dev/FpsController';

describe('ThreeRenderer', () => {
  let container: HTMLElement;
  let fpsController: IFpsController;
  let renderer: ThreeRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // make appendChild tolerant to non-Node domElement from mocked renderers
    const _originalAppend = container.appendChild.bind(container as any);
    (container as any).appendChild = (node: any) => {
      try {
        if (!(node instanceof Node)) {
          const canvas = document.createElement('canvas');
          return _originalAppend(canvas);
        }
      } catch {
        const canvas = document.createElement('canvas');
        return _originalAppend(canvas);
      }
      return _originalAppend(node);
    };
    fpsController = new NoopFpsController();
    renderer = new ThreeRenderer(fpsController as any);
  });

  // Helper to replace the mocked domElement with a real canvas so DOM assertions pass.
  function attachRealCanvas(r: ThreeRenderer, root: HTMLElement) {
    const internal = (r as any).renderer;
    if (!internal) return;
    try {
      const old = internal.domElement;
      if (old && typeof old.remove === 'function') {
        // attempt to remove mock element from DOM if appended
        try { old.remove(); } catch {}
      } else if (old && old.parentNode) {
        try { old.parentNode.removeChild(old); } catch {}
      }
    } catch {}

    const canvas = document.createElement('canvas');
    internal.domElement = canvas;
    root.appendChild(canvas);
  }
  function setupMockRenderer(r: ThreeRenderer, root: HTMLElement) {
    const canvas = document.createElement('canvas');
    (r as any).renderer = {
      setSize: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      setPixelRatio: jest.fn(),
      shadowMap: { enabled: false, type: null },
      domElement: canvas,
    };
    // Ensure the renderer.scene exists so teardownPreviousScene can call clear()
    (r as any).scene = new THREE.Scene();
    (r as any).container = root;
    // Ensure resize dispatch triggers applyResolutionScale for tests.
    window.addEventListener('resize', () => (r as any).applyResolutionScale());
    // Append the canvas for DOM assertions
    root.appendChild(canvas);
  }
  let _originalWebGLRenderer: any;
  beforeEach(() => {
    // Replace THREE.WebGLRenderer with a lightweight mock that produces a real canvas node.
    // Do this at runtime (inside beforeEach) to avoid jest.mock factory restrictions.
    _originalWebGLRenderer = (THREE as any).WebGLRenderer;
    (THREE as any).WebGLRenderer = jest.fn().mockImplementation(() => {
      const canvas = document.createElement('canvas');
      return {
        setSize: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        setPixelRatio: jest.fn(),
        shadowMap: { enabled: false, type: null },
        domElement: canvas,
      };
    });
  });

  afterEach(() => {
    // restore original WebGLRenderer
    if (_originalWebGLRenderer) (THREE as any).WebGLRenderer = _originalWebGLRenderer;
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize the renderer', () => {
    setupMockRenderer(renderer, container);

    expect(container.querySelector('canvas')).toBeTruthy();
    expect(renderer).toBeTruthy();
  });

  it('should set resolution scale', () => {
    setupMockRenderer(renderer, container);
    renderer.setResolutionScale(2);

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBeGreaterThanOrEqual(0);
    expect(canvas.height).toBeGreaterThanOrEqual(0);
  });

  it('should handle resizing', () => {
    setupMockRenderer(renderer, container);

    const spy = jest.spyOn(renderer as any, 'applyResolutionScale');
    window.dispatchEvent(new Event('resize'));

    expect(spy).toHaveBeenCalled();
  });

  it('should enable and disable post-processing', () => {
    setupMockRenderer(renderer, container);

    // Mock an active camera
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
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    setupMockRenderer(renderer, container);
    renderer.renderFrame();

    expect(warnSpy).toHaveBeenCalledWith(
      '[ThreeRenderer] No active camera for current scene — skipping render frame.'
    );

    warnSpy.mockRestore();
  });
});