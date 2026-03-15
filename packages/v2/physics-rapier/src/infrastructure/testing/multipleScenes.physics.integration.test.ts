/**
 * Integration tests: multiple scenes with physics run at the same time.
 * Each scene has its own Rapier World; update runs physics for all scenes.
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
  setEntityPosition,
  getEntityWorldPosition,
} from './testHelpers';

describe('Physics multiple scenes integration', () => {
  it('two scenes each have independent physics world and port', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const floorA = createEntityId('floorA');
    const floorB = createEntityId('floorB');

    addSceneWithEntity(api, sceneA, floorA);
    addEntityWithStaticFloor(api, sceneA, floorA, { x: 2, y: 0.5, z: 2 });

    addSceneWithEntity(api, sceneB, floorB);
    addEntityWithStaticFloor(api, sceneB, floorB, { x: 3, y: 0.5, z: 3 });

    runFrames(api, 2);

    const portA = getPhysicsPort(engine, sceneA);
    const portB = getPhysicsPort(engine, sceneB);
    expect(portA).toBeDefined();
    expect(portB).toBeDefined();
    expect(portA).not.toBe(portB);

    const hitA = portA!.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    const hitB = portB!.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hitA).not.toBeNull();
    expect(hitB).not.toBeNull();
    expect(hitA!.entityId).toBe(floorA);
    expect(hitB!.entityId).toBe(floorB);
  });

  it('dynamic bodies in scene A and scene B fall independently', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneA = createSceneId('sceneA');
    const sceneB = createSceneId('sceneB');
    const floorA = createEntityId('floorA');
    const floorB = createEntityId('floorB');
    const boxA = createEntityId('boxA');
    const boxB = createEntityId('boxB');

    addSceneWithEntity(api, sceneA, floorA);
    addEntityWithStaticFloor(api, sceneA, floorA, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneA, boxA);
    setEntityPosition(engine, sceneA, boxA, 0, 3, 0);
    addEntityWithRigidBody(api, sceneA, boxA, { bodyType: 'dynamic', withBoxCollider: true });

    addSceneWithEntity(api, sceneB, floorB);
    addEntityWithStaticFloor(api, sceneB, floorB, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneB, boxB);
    setEntityPosition(engine, sceneB, boxB, 0, 5, 0);
    addEntityWithRigidBody(api, sceneB, boxB, { bodyType: 'dynamic', withBoxCollider: true });

    runFrames(api, 60);

    const posA = getEntityWorldPosition(engine, sceneA, boxA);
    const posB = getEntityWorldPosition(engine, sceneB, boxB);
    expect(posA).toBeDefined();
    expect(posB).toBeDefined();
    expect(posA!.y).toBeLessThan(3);
    expect(posB!.y).toBeLessThan(5);
  });
});
