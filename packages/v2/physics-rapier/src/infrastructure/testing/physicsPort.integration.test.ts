/**
 * Integration tests for the physics query port: raycast and getCollisionEvents.
 * Engine + physics only, no scripting.
 */
import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupPhysicsIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithStaticFloor,
  addEntityWithRigidBody,
  runFrames,
  getPhysicsPort,
  getCollisionEvents,
  setEntityPosition,
} from './testHelpers';

describe('Physics port integration (raycast and collision events)', () => {
  it('raycast returns hit with entityId, point, normal and distance', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId);
    expect(port).toBeDefined();
    const hit = port!.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hit).not.toBeNull();
    if (!hit) return;
    expect(hit.entityId).toBe(floorId);
    expect(hit.distance).toBeGreaterThan(0);
    expect(hit.distance).toBeLessThan(10);
    expect(hit.point).toBeDefined();
    expect(hit.point.y).toBeCloseTo(0.5, 1);
    expect(hit.normal).toBeDefined();
    expect(hit.normal.y).toBeCloseTo(1, 1);
  });

  it('raycast with no hit returns null', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 1, y: 0.5, z: 1 });
    runFrames(api, 1);

    const port = getPhysicsPort(engine, sceneId);
    const hit = port!.raycast({
      origin: { x: 10, y: 5, z: 10 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 5,
    });
    expect(hit).toBeNull();
  });

  it('raycast with zero direction returns null (edge case)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    runFrames(api, 1);

    const port = getPhysicsPort(engine, sceneId);
    const hit = port!.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: 0, z: 0 },
      maxDistance: 10,
    });
    expect(hit).toBeNull();
  });

  it('getCollisionEvents returns array from port', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);

    runFrames(api, 80);

    const events = getCollisionEvents(engine, sceneId);
    expect(Array.isArray(events)).toBe(true);
    const boxFloorPair = events.find(
      (e) =>
        (e.a === boxId && e.b === floorId) || (e.a === floorId && e.b === boxId),
    );
    if (boxFloorPair) {
      expect(['enter', 'stay', 'exit'].includes(boxFloorPair.kind)).toBe(true);
    }
  });
});
