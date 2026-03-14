import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId, createViewportId, createCanvasId } from '../setup';
import type { TestContext } from '../setup';
import { createEntity } from '../../../domain/entities/entity';
import { createComponent } from '../../../domain/components/factory';
import { isViewportDebugEnabled } from '../../../domain/viewport';

describe('Integration: Viewport > setViewportDebugEnabled', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupIntegrationTest();
    ctx.api.addScene({ sceneId: createSceneId('main') });

    const cam = createEntity(createEntityId('cam'));
    ctx.api.scene(createSceneId('main')).addEntity({ entity: cam });
    ctx.api.scene(createSceneId('main')).entity(createEntityId('cam')).addComponent({
      component: createComponent('cameraView') as any,
    });

    const result = ctx.api.addViewport({
      id: createViewportId('vp1'),
      sceneId: createSceneId('main'),
      cameraEntityId: createEntityId('cam'),
      canvasId: createCanvasId('c1'),
    });
    expect(result.ok).toBe(true);
  });

  it('should default to false when kind not set', () => {
    const vp = ctx.engine.viewports.get(createViewportId('vp1'))!;
    expect(isViewportDebugEnabled(vp, 'collider')).toBe(false);
  });

  it('should set and read viewport debug flag for collider', () => {
    const vpApi = ctx.api.viewport(createViewportId('vp1'));

    vpApi.setDebug({ kind: 'collider', enabled: true });
    expect(ctx.engine.viewports.get(createViewportId('vp1'))?.debugFlags.get('collider')).toBe(true);

    vpApi.setDebug({ kind: 'collider', enabled: false });
    expect(ctx.engine.viewports.get(createViewportId('vp1'))?.debugFlags.get('collider')).toBe(false);
  });

  it('should allow different flags per viewport', () => {
    ctx.api.addViewport({
      id: createViewportId('vp2'),
      sceneId: createSceneId('main'),
      cameraEntityId: createEntityId('cam'),
      canvasId: createCanvasId('c1'),
    });

    ctx.api.viewport(createViewportId('vp1')).setDebug({ kind: 'collider', enabled: true });
    ctx.api.viewport(createViewportId('vp2')).setDebug({ kind: 'mesh', enabled: true });

    expect(ctx.engine.viewports.get(createViewportId('vp1'))?.debugFlags.get('collider')).toBe(true);
    expect(ctx.engine.viewports.get(createViewportId('vp1'))?.debugFlags.get('mesh')).toBeFalsy();
    expect(ctx.engine.viewports.get(createViewportId('vp2'))?.debugFlags.get('mesh')).toBe(true);
    expect(ctx.engine.viewports.get(createViewportId('vp2'))?.debugFlags.get('collider')).toBeFalsy();
  });
});
