// Mock three/webgpu before any imports — WebGPURenderer is the only renderer used.
jest.mock('three/webgpu', () => {
  const actual = jest.requireActual('three');

  const makeMockRenderer = () => {
    const canvas = (globalThis as any).document?.createElement?.('canvas') ?? {};
    return {
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
  };

  return {
    ...actual,
    WebGPURenderer: jest.fn().mockImplementation(makeMockRenderer),
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

    // Make element sizes stable for aspect calculations in jsdom.
    Object.defineProperty(rootA, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(rootA, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(rootB, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(rootB, 'clientHeight', { value: 300, configurable: true });
  });

  afterEach(() => {
    document.body.removeChild(rootA);
    document.body.removeChild(rootB);
    jest.clearAllMocks();
  });

  it('creates a default view and can add another view', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);

    expect(rootA.querySelector('canvas')).toBeTruthy();

    const viewId = await engine.addView(rootB);
    expect(viewId).toBeTruthy();
    expect(rootB.querySelector('canvas')).toBeTruthy();
  });

  it('renders once per view per frame', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);
    await engine.addView(rootB, { id: 'b' });

    const cam = new THREE.PerspectiveCamera();
    jest.spyOn(engine as any, 'getCameraForView').mockReturnValue(cam);

    engine.renderFrame();

    const views = (engine as any).views as Map<string, any>;
    const vMain = views.get('main');
    const vB = views.get('b');

    expect(vMain.renderer.render).toHaveBeenCalledTimes(1);
    expect(vB.renderer.render).toHaveBeenCalledTimes(1);
  });

  it('removeView disposes and removes the canvas', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);
    const viewId = await engine.addView(rootB, { id: 'extra' });

    expect(rootB.querySelector('canvas')).toBeTruthy();

    engine.removeView(viewId);

    expect(engine.getViews().find((v) => v.id === viewId)).toBeUndefined();
  });

  it('setViewCamera assigns a per-view camera entity id', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);

    engine.setViewCamera('main', 'cam-entity-1');

    const views = (engine as any).views as Map<string, any>;
    expect(views.get('main')?.cameraEntityId).toBe('cam-entity-1');
  });

  it('setScene calls scene.setup and teardown on re-assignment', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);

    const mockScene = { setup: jest.fn(), teardown: jest.fn() } as any;
    engine.setScene(mockScene);
    expect(mockScene.setup).toHaveBeenCalledTimes(1);

    engine.setScene(mockScene);
    expect(mockScene.teardown).toHaveBeenCalledTimes(1);
    expect(mockScene.setup).toHaveBeenCalledTimes(2);
  });

  it('handleResize is debounced via RAF', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);

    jest.useFakeTimers();
    const spy = jest.spyOn(engine as any, 'applyResolutionForAllViews');

    engine.handleResize();
    expect(spy).not.toHaveBeenCalled(); // debounced, not yet

    jest.runAllTimers();
    expect(spy).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('start and stop control the RAF loop', async () => {
    const engine = new ThreeMultiRenderer(new NoopFpsController() as any);
    await engine.init(rootA);

    engine.start();
    expect((engine as any).rafId).not.toBeNull();

    engine.stop();
    expect((engine as any).rafId).toBeNull();
  });
});
