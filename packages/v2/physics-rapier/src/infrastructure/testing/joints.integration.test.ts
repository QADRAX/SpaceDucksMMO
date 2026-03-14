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

    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'static' });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'fixed',
      withBoxCollider: true,
    });
    setEntityPosition(engine, sceneId, parentId, 0, 2, 0);
    setEntityPosition(engine, sceneId, childId, 1, 0, 0);

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

    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'dynamic', withBoxCollider: true });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'revolute',
      withBoxCollider: true,
    });
    setEntityPosition(engine, sceneId, parentId, 0, 4, 0);
    setEntityPosition(engine, sceneId, childId, 0.5, 0, 0);

    runFrames(api, 20);

    const parentPos = getEntityWorldPosition(engine, sceneId, parentId);
    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(parentPos).toBeDefined();
    expect(childPos).toBeDefined();
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

    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'static' });
    addRigidBodyToEntity(api, sceneId, childId, {
      bodyType: 'dynamic',
      jointToParent: 'spherical',
      withBoxCollider: true,
    });
    setEntityPosition(engine, sceneId, parentId, 0, 3, 0);
    setEntityPosition(engine, sceneId, childId, 0, -0.5, 0);

    runFrames(api, 40);

    const childPos = getEntityWorldPosition(engine, sceneId, childId);
    expect(childPos).toBeDefined();
    if (!childPos) return;
    expect(childPos.y).toBeGreaterThan(0.5);
    expect(childPos.y).toBeLessThan(4);
  });
});
