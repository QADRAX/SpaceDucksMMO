import BaseScene from './BaseScene';
import { Entity, Component } from '@duckengine/ecs';
import type { TextureCatalogService } from '../../domain/assets/TextureCatalog';

class TestComp extends Component {
  readonly type = 'test-comp';
  readonly metadata = { unique: false } as any;
  public poke() { this.notifyChanged(); }
}

describe('BaseScene debug events', () => {
  class TestScene extends BaseScene {
    readonly id = 'Sandbox';
  }

  it('auto-attaches and detaches collisionEvents hub when physics system is provided', () => {
    let subscribed = 0;
    let unsubscribed = 0;

    const physics = {
      addEntity: () => {},
      removeEntity: () => {},
      update: () => {},
      dispose: () => {},
      subscribeCollisions: (_listener: any) => {
        subscribed += 1;
        return () => {
          unsubscribed += 1;
        };
      },
    } as any;

    const engine: any = {
      createPhysicsSystem: () => physics,
      onActiveCameraChanged: jest.fn(),
    };

    const scene = new TestScene({} as any);
    scene.setup(engine, {});
    expect(subscribed).toBe(1);

    scene.teardown(engine, {});
    expect(unsubscribed).toBe(1);
  });

  it('calls physics system add/remove/update/dispose through the scene lifecycle', () => {
    const calls: string[] = [];

    const physics = {
      addEntity: (e: Entity) => calls.push(`add:${e.id}`),
      removeEntity: (id: string) => calls.push(`remove:${id}`),
      update: (_dt: number) => calls.push('update'),
      dispose: () => calls.push('dispose'),
    } as any;

    const engine: any = {
      createPhysicsSystem: () => physics,
      onActiveCameraChanged: jest.fn(),
    };

    const scene = new TestScene({} as any);
    scene.setup(engine, {});

    const e1 = new Entity('e1');
    scene.addEntity(e1);
    expect(calls).toContain('add:e1');

    scene.update(16);
    expect(calls).toContain('update');

    scene.removeEntity('e1');
    expect(calls).toContain('remove:e1');

    scene.teardown(engine, {});
    expect(calls).toContain('dispose');
  });

  it('setup creates a texture resolver from settings+catalog and passes it to createRenderSyncSystem', () => {
    let settingsListener: any;
    const settingsService = {
      getSettings: () => ({ graphics: { textureQuality: 'low' } }),
      subscribe: (listener: any) => {
        settingsListener = listener;
        return () => {};
      },
    } as any;

    const catalog: TextureCatalogService = {
      getCatalog: async () => ({ variants: [] }),
      getVariantsById: async () => [],
      getBestVariant: async () => undefined,
      subscribe: (listener) => {
        listener({ variants: [] });
        return () => {};
      },
    };

    let receivedResolver: any;
    const engine: any = {
      getTextureCatalog: () => catalog,
      createRenderSyncSystem: jest.fn((_renderScene: any, _catalog: any, resolver: any) => {
        receivedResolver = resolver;
        return undefined;
      }),
    };

    const scene = new TestScene(settingsService);
    const renderScene = {};
    scene.setup(engine, renderScene);

    expect(engine.createRenderSyncSystem).toHaveBeenCalledTimes(1);
    expect(receivedResolver).toBeDefined();
    expect(typeof receivedResolver.resolve).toBe('function');
    expect(receivedResolver.getCurrentQuality()).toBe('low');

    // simulate settings update
    settingsListener?.({ graphics: { textureQuality: 'ultra' } });
    expect(receivedResolver.getCurrentQuality()).toBe('ultra');
  });

  it('emits entity-added and entity-removed and hierarchy-changed', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    const unsub = scene.subscribeChanges((ev) => events.push(ev));

    const e1 = new Entity('e1');
    scene.addEntity(e1);

    expect(events.length).toBeGreaterThanOrEqual(1);
    const added = events.find((e) => e.kind === 'entity-added');
    expect(added).toBeDefined();
    expect(added.entity).toBe(e1);

    // add parent and reparent
    const p = new Entity('p');
    scene.addEntity(p);
    scene.reparentEntity('e1', 'p');
    const hierarchy = events.find((e) => e.kind === 'hierarchy-changed' && e.childId === 'e1');
    expect(hierarchy).toBeDefined();
    expect(hierarchy.newParentId).toBe('p');

    // remove child
    scene.removeEntity('e1');
    const removed = events.find((e) => e.kind === 'entity-removed' && e.entityId === 'e1');
    expect(removed).toBeDefined();

    unsub();
  });

  it('emits component-changed when component toggled and transform-changed on transform update', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    const unsub = scene.subscribeChanges((ev) => events.push(ev));

    const e = new Entity('ent1');
    const c = new TestComp();
    e.addComponent(c);

    scene.addEntity(e);

    // toggle enabled should emit component-changed
    c.enabled = false;
    const compEvent = events.find((ev) => ev.kind === 'component-changed' && ev.entityId === 'ent1');
    expect(compEvent).toBeDefined();
    expect(compEvent.componentType).toBe('test-comp');

    // transform change
    e.transform.setPosition(1, 2, 3);
    const tEvent = events.find((ev) => ev.kind === 'transform-changed' && ev.entityId === 'ent1');
    expect(tEvent).toBeDefined();

    unsub();
  });

  it('reparentEntity updates hierarchy and emits event', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    scene.subscribeChanges((ev) => events.push(ev));

    const child = new Entity('child');
    const parent = new Entity('parent');
    scene.addEntity(child);
    scene.addEntity(parent);

    scene.reparentEntity('child', 'parent');

    const h = events.find((ev) => ev.kind === 'hierarchy-changed' && ev.childId === 'child');
    expect(h).toBeDefined();
    expect(h.newParentId).toBe('parent');
  });

  it('setActiveCamera updates activeCameraId and emits event when valid', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    scene.subscribeChanges((ev) => events.push(ev));

    const cam = new Entity('cam');
    scene.addEntity(cam);

    // No CameraViewComponent in RenderSyncSystem, so setup a fake renderSyncSystem that reports a camera
    scene['renderSyncSystem'] = { getCamera: (id: string) => ({}), setActiveCameraEntityId: jest.fn() } as any;

    scene.setActiveCamera('cam');
    const ev = events.find((e) => e.kind === 'active-camera-changed');
    expect(ev).toBeDefined();
    expect(scene.getActiveCamera()).toBeDefined();
    expect(scene['activeCameraId']).toBe('cam');
  });

  it('setActiveCamera does not emit when invalid', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    scene.subscribeChanges((ev) => events.push(ev));

    // no entities
    scene['renderSyncSystem'] = { getCamera: (_: string) => undefined, setActiveCameraEntityId: jest.fn() } as any;
    scene.setActiveCamera('nope');
    expect(events.find((e) => e.kind === 'active-camera-changed')).toBeUndefined();
  });

  it('teardown detaches observers so later component changes are not emitted', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    scene.subscribeChanges((ev) => events.push(ev));

    const e = new Entity('ent2');
    const c = new TestComp();
    e.addComponent(c);
    scene.addEntity(e);

    // clear events then teardown
    events.length = 0;
    scene.teardown(undefined as any, undefined as any);

    // toggle component after teardown should NOT emit
    c.enabled = true;

    expect(events.find((ev) => ev.kind === 'component-changed')).toBeUndefined();
  });

  it('prevents reparenting that would create cycles and emits error', () => {
    const scene = new TestScene({} as any);
    const events: any[] = [];
    scene.subscribeChanges((ev) => events.push(ev));

    const A = new Entity('A');
    const B = new Entity('B');
    const C = new Entity('C');
    scene.addEntity(A);
    scene.addEntity(B);
    scene.addEntity(C);

    // Build A -> B -> C (A parent of B, B parent of C)
    scene.reparentEntity('B', 'A');
    scene.reparentEntity('C', 'B');

    // Attempt to set A as child of C -> would create cycle. Should be rejected.
    events.length = 0;
    scene.reparentEntity('A', 'C');

    const err = events.find((ev) => ev.kind === 'error');
    expect(err).toBeDefined();

    const h = events.find((ev) => ev.kind === 'hierarchy-changed' && ev.childId === 'A');
    expect(h).toBeUndefined();
  });
});
