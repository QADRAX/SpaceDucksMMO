/**
 * Smoke integration tests for the physics (Rapier) subsystem.
 * Requires Rapier WASM to be initialized; see setup.ts and jest.config.js.
 * Extended tests: useCases, joints, compoundColliders, physicsPort.
 */
import { createSceneId, createEntityId } from '@duckengine/core-v2';
import { setupPhysicsIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithStaticFloor,
  addEntityWithRigidBody,
  runFrames,
  getPhysicsPort,
  setEntityPosition,
  getEntityWorldPosition,
} from './testHelpers';

describe('Physics subsystem integration', () => {
  it('registers the physics query port and raycast hits static floor', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId);
    expect(port).toBeDefined();
    expect(port).toBeTruthy();
    expect(port?.raycast).toBeDefined();
    if (!port) return;

    const hit = port.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hit).not.toBeNull();
    expect(hit).toBeTruthy();
    if (!hit) return;
    expect(hit.entityId).toBe(floorId);
    expect(hit.distance).toBeGreaterThan(0);
    expect(hit.distance).toBeLessThan(10);
    expect(hit.point.y).toBeCloseTo(0.5, 1);
  });

  it('dynamic rigid body falls under gravity after several frames', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 5, 0);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });

    runFrames(api, 1);
    const posBefore = getEntityWorldPosition(engine, sceneId, boxId);
    expect(posBefore).toBeDefined();
    if (!posBefore) return;
    const yBefore = posBefore.y;

    runFrames(api, 60);
    const posAfter = getEntityWorldPosition(engine, sceneId, boxId);
    expect(posAfter).toBeDefined();
    expect(posAfter).toBeTruthy();
    if (!posAfter) return;
    expect(posAfter.y).toBeLessThan(yBefore);
  });
});
