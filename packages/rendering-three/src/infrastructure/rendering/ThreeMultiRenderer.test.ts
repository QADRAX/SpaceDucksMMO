jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    WebGLRenderer: jest.fn().mockImplementation(() => {
      const canvas = (globalThis as any).document?.createElement?.('canvas') ?? {};
      return {
        setSize: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        setPixelRatio: jest.fn(),
        clear: jest.fn(),
        setClearColor: jest.fn(),
        shadowMap: { enabled: false, type: null },
        domElement: canvas,
      };
    }),
  };
});

import * as THREE from 'three';

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

import { ThreeMultiRenderer } from './ThreeMultiRenderer';
import { NoopFpsController } from '../ui/dev/FpsController';

describe('ThreeMultiRenderer', () => {
  let rootA: HTMLElement;
  let rootB: HTMLElement;

  beforeEach(() => {
    rootA = document.createElement('div');
    rootB = document.createElement('div');
    document.body.appendChild(rootA);
    document.body.appendChild(rootB);

    // Make element sizes stable for aspect calculations
    Object.defineProperty(rootA, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(rootA, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(rootB, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(rootB, 'clientHeight', { value: 300, configurable: true });

  });

  afterEach(() => {
    document.body.removeChild(rootA);
    document.body.removeChild(rootB);
  });

  it('creates a default view and can add another view', () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    engine.init(rootA);

    expect(rootA.querySelector('canvas')).toBeTruthy();

    const viewId = engine.addView(rootB);
    expect(viewId).toBeTruthy();
    expect(rootB.querySelector('canvas')).toBeTruthy();
  });

  it('renders once per view per frame', () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    engine.init(rootA);
    engine.addView(rootB, { id: 'b' });

    const cam = new THREE.PerspectiveCamera();
    jest.spyOn(engine as any, 'getCameraForView').mockReturnValue(cam);

    engine.renderFrame();

    const views = (engine as any).views as Map<string, any>;
    const vMain = views.get('main');
    const vB = views.get('b');

    expect(vMain.renderer.render).toHaveBeenCalledTimes(1);
    expect(vB.renderer.render).toHaveBeenCalledTimes(1);
  });
});
