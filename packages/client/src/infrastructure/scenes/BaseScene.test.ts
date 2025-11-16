import BaseScene from './BaseScene';
import { Entity } from '@client/domain/ecs/core/Entity';
import SceneId from '@client/domain/scene/SceneId';
import { Component } from '@client/domain/ecs/core/Component';

class TestComp extends Component {
  readonly type = 'test-comp';
  readonly metadata = { unique: false } as any;
  public poke() { this.notifyChanged(); }
}

describe('BaseScene debug events', () => {
  class TestScene extends BaseScene {
    readonly id = SceneId.Sandbox;
  }

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
});
