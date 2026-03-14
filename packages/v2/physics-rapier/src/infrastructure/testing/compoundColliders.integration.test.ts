/**
 * Integration tests for compound colliders: one rigid body with multiple child entities
 * each having a collider (box, sphere, capsule), forming a single compound shape in physics.
 * Engine + physics only, no scripting.
 */
import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupPhysicsIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithStaticFloor,
  addCompoundCollidersToScene,
  runFrames,
  getPhysicsPort,
  setEntityPosition,
  getEntityWorldPosition,
} from './testHelpers';

describe('Physics compound colliders integration', () => {
  it('compound body with box + sphere colliders falls and raycast hits correct collider owner', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const rootId = createEntityId('compound');
    const boxChildId = createEntityId('boxPart');
    const sphereChildId = createEntityId('spherePart');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addCompoundCollidersToScene(api, sceneId, rootId, [
      { entityId: boxChildId, type: 'boxCollider', halfExtents: { x: 0.3, y: 0.3, z: 0.3 } },
      { entityId: sphereChildId, type: 'sphereCollider', radius: 0.4 },
    ]);
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);
    setEntityPosition(engine, sceneId, rootId, 0, 4, 0);
    setEntityPosition(engine, sceneId, boxChildId, -0.5, 0, 0);
    setEntityPosition(engine, sceneId, sphereChildId, 0.5, 0, 0);

    runFrames(api, 60);

    const pos = getEntityWorldPosition(engine, sceneId, rootId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeLessThan(4);
    expect(pos!.y).toBeGreaterThan(0.5);

    const port = getPhysicsPort(engine, sceneId);
    expect(port).toBeDefined();
    const hit = port!.raycast({
      origin: { x: 0, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hit).not.toBeNull();
    expect(hit!.entityId).toBe(rootId);
  });

  it('compound with box + capsule colliders behaves as single rigid body', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const rootId = createEntityId('compound');
    const boxId = createEntityId('boxPart');
    const capsuleId = createEntityId('capsulePart');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addCompoundCollidersToScene(api, sceneId, rootId, [
      { entityId: boxId, type: 'boxCollider', halfExtents: { x: 0.25, y: 0.25, z: 0.25 } },
      { entityId: capsuleId, type: 'capsuleCollider', radius: 0.2, halfHeight: 0.3 },
    ]);
    setEntityPosition(engine, sceneId, rootId, 0, 3, 0);

    runFrames(api, 50);

    const pos = getEntityWorldPosition(engine, sceneId, rootId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeLessThan(3);
    expect(pos!.y).toBeGreaterThan(0.4);
  });

  it('compound with multiple sphere colliders: all contribute to one body', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const rootId = createEntityId('compound');
    const s1Id = createEntityId('s1');
    const s2Id = createEntityId('s2');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addCompoundCollidersToScene(api, sceneId, rootId, [
      { entityId: s1Id, type: 'sphereCollider', radius: 0.3 },
      { entityId: s2Id, type: 'sphereCollider', radius: 0.3 },
    ]);
    setEntityPosition(engine, sceneId, rootId, 0, 5, 0);
    setEntityPosition(engine, sceneId, s1Id, -0.4, 0, 0);
    setEntityPosition(engine, sceneId, s2Id, 0.4, 0, 0);

    runFrames(api, 80);

    const pos = getEntityWorldPosition(engine, sceneId, rootId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeLessThan(5);
    expect(pos!.y).toBeGreaterThan(-2);
  });
});
