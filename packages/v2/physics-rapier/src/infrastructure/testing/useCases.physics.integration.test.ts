/**
 * Integration tests for physics use cases: addEntity, removeEntity, stepPhysics,
 * onComponentChangedPhysics, disposePhysics. Engine + physics only, no scripting.
 */
import { createSceneId, createEntityId, createComponent } from '@duckengine/core-v2';
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

describe('Physics use cases integration', () => {
  it('addEntityToPhysics: entity with rigidBody and collider is added to world', async () => {
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
    expect(hit!.entityId).toBe(floorId);
  });

  it('removeEntityFromPhysics: removing entity removes body and collider from world', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    runFrames(api, 2);

    const scene = api.scene(sceneId);
    scene.removeEntity({ entityId: boxId });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId);
    const hit = port!.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hit).not.toBeNull();
    expect(hit!.entityId).toBe(floorId);
  });

  it('stepPhysics: gravity is applied and dynamic body position is written back', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 5, 0);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });

    runFrames(api, 1);
    const yBefore = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    runFrames(api, 60);
    const yAfter = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    expect(yAfter).toBeLessThan(yBefore);
  });

  it('onComponentChangedPhysics: adding rigidBody after entity-added syncs entity to physics', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 3, 0);

    api.scene(sceneId).entity(boxId).addComponent({
      component: createComponent('rigidBody', { bodyType: 'dynamic' }),
    });
    api.scene(sceneId).entity(boxId).addComponent({
      component: createComponent('boxCollider', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }),
    });
    runFrames(api, 30);

    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeLessThan(3);
  });

  it('removeScene: after removing scene, engine update does not throw', async () => {
    const { api } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 2, y: 0.5, z: 2 });
    runFrames(api, 1);

    const result = api.removeScene({ sceneId });
    expect(result.ok).toBe(true);
    expect(() => runFrames(api, 2)).not.toThrow();
  });
});
