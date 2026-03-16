/**
 * Integration tests for rigid body composition with joints (parent-child linked bodies).
 * Tests fixed, revolute, and spherical jointToParent. Engine + physics only, no scripting.
 */
import { createSceneId, createEntityId, createEntity } from '@duckengine/core-v2';
import { setupPhysicsIntegrationTest } from './setup';
import {
  addSceneWithParentChild,
  addRigidBodyToEntity,
  addEntityWithStaticFloor,
  runFrames,
  setEntityPosition,
  getEntityWorldPosition,
} from './testHelpers';

describe('Physics joints integration (rigid body composition)', () => {
  it('parent and child with fixed joint stay linked (child does not fall independently)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const parentId = createEntityId('parent');
    const childId = createEntityId('child');

    addSceneWithParentChild(api, sceneId, parentId, childId);
    api.scene(sceneId).addEntity({ entity: createEntity(floorId) });
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    setEntityPosition(engine, sceneId, parentId, 0, 2, 0);
    setEntityPosition(engine, sceneId, childId, 1, 0, 0);
    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'static' });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'fixed',
      withBoxCollider: true,
    });

    runFrames(api, 60);

    const parentPos = getEntityWorldPosition(engine, sceneId, parentId);
    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(parentPos).toBeDefined();
    expect(childPos).toBeDefined();
    if (!parentPos || !childPos) return;
    expect(parentPos.y).toBeCloseTo(2, 0);
    expect(childPos.y).toBeCloseTo(2, 0);
    expect(Math.abs(childPos.x - parentPos.x)).toBeLessThan(2);
  });

  it('parent dynamic and child with revolute joint: both have bodies and run without crash', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const parentId = createEntityId('parent');
    const childId = createEntityId('child');

    addSceneWithParentChild(api, sceneId, parentId, childId);
    api.scene(sceneId).addEntity({ entity: createEntity(floorId) });
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    setEntityPosition(engine, sceneId, parentId, 0, 4, 0);
    setEntityPosition(engine, sceneId, childId, 0.5, 0, 0);
    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'dynamic', withBoxCollider: true });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'revolute',
      withBoxCollider: true,
    });

    runFrames(api, 20);

    const parentPos = getEntityWorldPosition(engine, sceneId, parentId);
    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(parentPos).toBeDefined();
    expect(childPos).toBeDefined();
  });

  /**
   * Replicates balance-scale pendulum: parent (cube) + child (cylinder) with revolute joint.
   * Child has local position (0, -1.6, 0) — should appear BELOW parent.
   * Bug: with physics, cylinder was rendering above the cube (Y inversion in joint/write-back).
   */
  it('revolute joint: child with local y:-1.6 stays below parent (balance-scale pendulum)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const parentId = createEntityId('parent');
    const childId = createEntityId('child');

    addSceneWithParentChild(api, sceneId, parentId, childId);
    api.scene(sceneId).addEntity({ entity: createEntity(floorId) });
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    // Parent at (0, 2.8, 0) — cube anchor
    setEntityPosition(engine, sceneId, parentId, 0, 2.8, 0);
    // Child local (0, -1.6, 0) — cylinder hangs below cube
    setEntityPosition(engine, sceneId, childId, 0, -1.6, 0);

    addRigidBodyToEntity(api, sceneId, parentId, {
      bodyType: 'static',
      withBoxCollider: true,
    });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'revolute',
      withCylinderCollider: true,
    });

    // Before any physics step: child world Y should be 2.8 - 1.6 = 1.2 (below parent)
    const posBefore = getEntityWorldPosition(engine, sceneId, childId);
    expect(posBefore).toBeDefined();
    if (!posBefore) return;
    expect(posBefore.y).toBeCloseTo(1.2, 1);
    expect(posBefore.y).toBeLessThan(2.8);

    // After 1 frame: physics runs, child should not jump above parent
    runFrames(api, 1);
    const parentPos = getEntityWorldPosition(engine, sceneId, parentId);
    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(parentPos).toBeDefined();
    expect(childPos).toBeDefined();
    if (!parentPos || !childPos) return;
    // Child must be below or at most level with parent — never above
    expect(childPos.y).toBeLessThanOrEqual(parentPos.y + 0.01);
  });

  it('parent and child with spherical joint: linked with ball-and-socket behavior', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const parentId = createEntityId('parent');
    const childId = createEntityId('child');

    addSceneWithParentChild(api, sceneId, parentId, childId);
    api.scene(sceneId).addEntity({ entity: createEntity(floorId) });
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    setEntityPosition(engine, sceneId, parentId, 0, 3, 0);
    setEntityPosition(engine, sceneId, childId, 0, -0.5, 0);
    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'static' });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'spherical',
      withBoxCollider: true,
    });

    runFrames(api, 40);

    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(childPos).toBeDefined();
    if (!childPos) return;
    expect(childPos.y).toBeGreaterThan(0.5);
    expect(childPos.y).toBeLessThan(4);
  });
});
