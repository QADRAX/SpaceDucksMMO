import BaseScene from './BaseScene';
import { Entity } from '@client/domain/ecs/core/Entity';
import SceneId from '@client/domain/scene/SceneId';

describe('BaseScene result-based reparent', () => {
  class TestScene extends BaseScene {
    readonly id = SceneId.Sandbox;
  }

  it('reparentEntityResult returns error for cycle', () => {
    const scene = new TestScene({} as any);
    const A = new Entity('A');
    const B = new Entity('B');
    const C = new Entity('C');
    scene.addEntity(A);
    scene.addEntity(B);
    scene.addEntity(C);

    // Build A -> B -> C
    scene.reparentEntity('B', 'A');
    scene.reparentEntity('C', 'B');

    const res = scene.reparentEntityResult('A', 'C');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('invalid-reparent');
  });

  it('failed reparent leaves parent unchanged', () => {
    const scene = new TestScene({} as any);
    const parent = new Entity('P');
    const child = new Entity('C');
    scene.addEntity(parent);
    scene.addEntity(child);

    // attach C to P
    scene.reparentEntity('C', 'P');
    expect(child.parent).toBe(parent);

    // attempt to reparent to non-existent parent -> should return error and keep parent
    const res1 = scene.reparentEntityResult('C', 'NOPE');
    expect(res1.ok).toBe(false);
    expect(child.parent).toBe(parent);

    // Build deeper hierarchy P -> A -> B -> C2 and attempt cycle reparent under descendant
    const A = new Entity('A');
    const B = new Entity('B');
    const C2 = new Entity('C2');
    scene.addEntity(A);
    scene.addEntity(B);
    scene.addEntity(C2);

    scene.reparentEntity('A', 'P');
    scene.reparentEntity('B', 'A');
    scene.reparentEntity('C2', 'B');

    // attempt to reparent A under C2 (descendant) -> should error and A.parent remains P
    const res2 = scene.reparentEntityResult('A', 'C2');
    expect(res2.ok).toBe(false);
    expect(A.parent).toBe(parent);
  });
});
