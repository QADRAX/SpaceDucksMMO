import {
  addComponent,
  createComponent,
  createEngine,
  createEntity,
  createEntityId,
  createScene,
  createSceneId,
  createViewport,
  createViewportId,
  createCanvasId,
  UISurfaceHostPortDef,
  UIViewRuntimePortDef,
  UICustomRuntimePortDef,
} from '@duckengine/core-v2';
import { reconcileUiRoots } from './reconcileUiRoots';
import { createUISubsystemState } from '../domain/uiSubsystem/createUISubsystemState';
import { createMemoryUISurfaceHost } from '../infrastructure/adapters/memoryUISurfaceHost';
import { createRecordingUIViewRuntime } from '../infrastructure/adapters/recordingUIViewRuntime';

describe('reconcileUiRoots', () => {
  it('mounts uiView roots on matching viewport surfaces', () => {
    const engine = createEngine();
    const sceneId = createSceneId('main');
    const scene = createScene(sceneId);
    scene.engine = engine;
    engine.scenes.set(sceneId, scene);

    const vpId = createViewportId('vp-main');
    engine.viewports.set(
      vpId,
      createViewport({
        id: vpId,
        sceneId,
        cameraEntityId: createEntityId('cam'),
        canvasId: createCanvasId('canvas-1'),
      }),
    );

    const entity = createEntity(createEntityId('hud'));
    addComponent(
      entity,
      createComponent('transform2d', {
        position: { x: 0.1, y: 0.2 },
        size: { x: 0.5, y: 0.1 },
      }),
    );
    addComponent(
      entity,
      createComponent('uiView', {
        document: { type: 'column', children: [] },
        bindings: { hp: 1 },
        uiTarget: {},
      }),
    );
    scene.entities.set(entity.id, entity);

    const viewRuntime = createRecordingUIViewRuntime();
    const surfaceHost = createMemoryUISurfaceHost([{ viewportId: vpId }]);

    const portMap = new Map<string, unknown>([
      [UISurfaceHostPortDef.id, surfaceHost],
      [UIViewRuntimePortDef.id, viewRuntime],
      [UICustomRuntimePortDef.id, undefined],
    ]);

    const state = createUISubsystemState({
      engine,
      scene,
      ports: {
        get: (def: { id: string }) => portMap.get(def.id),
      } as never,
    });

    reconcileUiRoots.execute(state, { scene });

    expect(viewRuntime.calls).toHaveLength(1);
    expect(viewRuntime.calls[0]?.op).toBe('mount');
    if (viewRuntime.calls[0]?.op === 'mount') {
      expect(viewRuntime.calls[0].params.viewportId).toBe(vpId);
      expect(viewRuntime.calls[0].params.layout.rect).toEqual({
        x: 0.1,
        y: 0.2,
        w: 0.5,
        h: 0.1,
      });
    }
  });
});
