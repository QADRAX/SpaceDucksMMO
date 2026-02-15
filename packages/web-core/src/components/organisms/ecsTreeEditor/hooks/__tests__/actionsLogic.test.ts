import { Entity } from '@duckengine/ecs';

import { validateReparent } from '../actionsLogic';

describe('ecsTreeEditor actionsLogic', () => {
  test('allows reparent to root (no parent)', () => {
    const child = new Entity('child');
    const res = validateReparent(child, undefined);
    expect(res.ok).toBe(true);
  });

  test('rejects parenting to itself', () => {
    const child = new Entity('child');
    const res = validateReparent(child, child);
    expect(res).toEqual({ ok: false, error: 'Cannot parent an entity to itself' });
  });

  test('rejects parenting to descendant', () => {
    const root = new Entity('root');
    const child = new Entity('child');
    const grandchild = new Entity('grandchild');

    root.addChild(child);
    child.addChild(grandchild);

    const res = validateReparent(child, grandchild);
    expect(res).toEqual({ ok: false, error: 'Cannot parent an entity to its descendant' });
  });

  test('allows parenting to another branch', () => {
    const rootA = new Entity('rootA');
    const rootB = new Entity('rootB');
    const child = new Entity('child');

    rootA.addChild(child);

    const res = validateReparent(child, rootB);
    expect(res.ok).toBe(true);
  });
});
