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
});
