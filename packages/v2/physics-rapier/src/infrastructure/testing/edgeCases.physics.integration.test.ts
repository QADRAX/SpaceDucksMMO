/**
 * More complex scenarios / edge cases for the physics integration.
 * Engine + physics only, no scripting.
 */
import { createSceneId, createEntityId, createComponent, createEntity, addChild } from '@duckengine/core-v2';
import { setupPhysicsIntegrationTest } from './setup';
import {
  addSceneWithEntity,
  addEntityWithStaticFloor,
  addEntityWithRigidBody,
  addSceneWithParentChild,
  addRigidBodyToEntity,
  runFrames,
  getPhysicsPort,
  getCollisionEvents,
  setEntityPosition,
  setEntityScale,
  getEntityWorldPosition,
} from './testHelpers';

describe('Physics integration edge cases', () => {
  it('kinematic bodies sync from ECS transform (setEntityPosition affects simulation)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const kinId = createEntityId('kin');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });

    addSceneWithEntity(api, sceneId, kinId);
    addEntityWithRigidBody(api, sceneId, kinId, { bodyType: 'kinematic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, kinId, 0, 1, 0);
    runFrames(api, 2);

    setEntityPosition(engine, sceneId, kinId, 0, 3, 0);
    runFrames(api, 2);

    const pos = getEntityWorldPosition(engine, sceneId, kinId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeCloseTo(3, 0);
  });

  it('raycast respects maxDistance (edge case)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hit = port.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 1,
    });
    expect(hit).toBeNull();
  });

  it('removing collider component de-syncs collider (raycast no longer hits removed collider)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });

    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    // Position must be set before body/collider creation (static bodies won't be synced from ECS after).
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'static', withBoxCollider: true });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hitBefore = port.raycast({
      origin: { x: 0, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitBefore).not.toBeNull();
    expect(hitBefore!.entityId).toBe(boxId);

    api.scene(sceneId).entity(boxId).removeComponent({ componentType: 'boxCollider' });
    runFrames(api, 2);

    const hitAfter = port.raycast({
      origin: { x: 0, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitAfter).not.toBeNull();
    expect(hitAfter!.entityId).toBe(floorId);
  });

  it('reparenting a collider under another rigidBody changes physics attachment (raycast owner changes)', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const aId = createEntityId('A');
    const bId = createEntityId('B');
    const colId = createEntityId('col');

    // Scene + floor
    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 10, y: 0.5, z: 10 });
    setEntityPosition(engine, sceneId, floorId, 0, 0, 0);

    // Two rigid bodies A and B and one collider child under A
    const a = createEntity(aId);
    const col = createEntity(colId);
    addChild(a, col);
    api.scene(sceneId).addEntity({ entity: a });
    api.scene(sceneId).addEntity({ entity: createEntity(bId) });

    setEntityPosition(engine, sceneId, aId, -2, 2, 0);
    setEntityPosition(engine, sceneId, bId, 2, 2, 0);
    setEntityPosition(engine, sceneId, colId, 0, 0, 0);
    api.scene(sceneId).entity(aId).addComponent({ component: createComponent('rigidBody', { bodyType: 'static' }) });
    api.scene(sceneId).entity(bId).addComponent({ component: createComponent('rigidBody', { bodyType: 'static' }) });
    api.scene(sceneId).entity(colId).addComponent({ component: createComponent('boxCollider', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }) });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hitA = port.raycast({
      origin: { x: -2, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitA).not.toBeNull();
    expect(hitA!.entityId).toBe(aId);

    // Reparent collider from A -> B
    api.scene(sceneId).reparentEntity({ childId: colId, newParentId: bId });
    runFrames(api, 2);

    const hitB = port.raycast({
      origin: { x: 2, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitB).not.toBeNull();
    expect(hitB!.entityId).toBe(bId);
  });

  it('changing rigidBody bodyType from dynamic to kinematic: position is driven by ECS', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    runFrames(api, 30);

    const yDynamic = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    expect(yDynamic).toBeLessThan(2);

    const res = api.scene(sceneId).entity(boxId).component('rigidBody').setField({
      fieldKey: 'bodyType',
      value: 'kinematic',
    });
    expect(res.ok).toBe(true);
    setEntityPosition(engine, sceneId, boxId, 0, 5, 0);
    runFrames(api, 10);

    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeCloseTo(5, 0);
  });

  it('changing rigidBody bodyType from dynamic to static: body no longer moves', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 1, 0);
    runFrames(api, 5);

    api.scene(sceneId).entity(boxId).component('rigidBody').setField({
      fieldKey: 'bodyType',
      value: 'static',
    });
    setEntityPosition(engine, sceneId, boxId, 0, 3, 0);
    runFrames(api, 20);

    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeCloseTo(3, 0);
  });

  it('changing rigidBody gravityScale: sync runs and body remains in world', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 4, 0);
    runFrames(api, 2);

    const res = api.scene(sceneId).entity(boxId).component('rigidBody').setField({
      fieldKey: 'gravityScale',
      value: 0,
    });
    expect(res.ok).toBe(true);
    expect(() => runFrames(api, 20)).not.toThrow();
    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
  });

  it('changing rigidBody mass: sync runs without throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    runFrames(api, 2);

    const res = api.scene(sceneId).entity(boxId).component('rigidBody').setField({
      fieldKey: 'mass',
      value: 10,
    });
    expect(res.ok).toBe(true);
    expect(() => runFrames(api, 10)).not.toThrow();
  });

  it('empty scene: update runs without throw', async () => {
    const { api } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('empty');
    api.addScene({ sceneId });
    expect(() => runFrames(api, 5)).not.toThrow();
  });

  it('scene paused: physics phase skipped, dynamic body does not move', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 3, 0);
    runFrames(api, 5);

    const yBeforePause = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    api.scene(sceneId).setPaused({ paused: true });
    runFrames(api, 60);
    const yAfterPausedFrames = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    expect(yAfterPausedFrames).toBeCloseTo(yBeforePause, 5);
  });

  it('dt = 0: update does not throw, position unchanged after zero-dt frames', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 4, 0);
    runFrames(api, 2);

    const yBefore = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    expect(() => runFrames(api, 10, 0)).not.toThrow();
    const yAfter = getEntityWorldPosition(engine, sceneId, boxId)!.y;
    expect(yAfter).toBeCloseTo(yBefore, 5);
  });

  it('dt very large (500ms): accumulator and maxSubSteps limit substeps, no hang nor throw', async () => {
    const { api } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    expect(() => runFrames(api, 2, 500)).not.toThrow();
  });

  it('collision events: getCollisionEvents returns array; after contact, pair may appear as enter or stay', async () => {
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
      expect(['enter', 'stay', 'exit']).toContain(boxFloorPair.kind);
    }
  });

  it('scale on collider: entity scale affects collider size in world', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    setEntityScale(engine, sceneId, boxId, 2, 2, 2);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'static', withBoxCollider: true });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hit = port.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hit).not.toBeNull();
    expect(hit!.entityId).toBe(boxId);
    expect(hit!.point.y).toBeGreaterThanOrEqual(1);
    expect(hit!.point.y).toBeLessThanOrEqual(3);
  });

  it('removing rigidBody and collider: body and collider removed from world, raycast hits floor', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'static', withBoxCollider: true });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hitBefore = port.raycast({
      origin: { x: 0, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitBefore?.entityId).toBe(boxId);

    api.scene(sceneId).entity(boxId).removeComponent({ componentType: 'rigidBody' });
    api.scene(sceneId).entity(boxId).removeComponent({ componentType: 'boxCollider' });
    runFrames(api, 2);

    const hitAfter = port.raycast({
      origin: { x: 0, y: 10, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 20,
    });
    expect(hitAfter).not.toBeNull();
    expect(hitAfter!.entityId).toBe(floorId);
  });

  it('removeEntity with children that have physics: recursive remove, all leave world', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const parentId = createEntityId('parent');
    const childId = createEntityId('child');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithParentChild(api, sceneId, parentId, childId);
    addRigidBodyToEntity(api, sceneId, parentId, { bodyType: 'static' });
    addRigidBodyToEntity(api, sceneId, childId, { bodyType: 'static', withBoxCollider: true });
    setEntityPosition(engine, sceneId, parentId, 0, 2, 0);
    setEntityPosition(engine, sceneId, childId, 0.5, 0, 0);
    runFrames(api, 2);

    expect(engine.scenes.get(sceneId)?.entities.has(parentId)).toBe(true);
    expect(engine.scenes.get(sceneId)?.entities.has(childId)).toBe(true);

    const removeResult = api.scene(sceneId).removeEntity({ entityId: parentId });
    expect(removeResult.ok).toBe(true);
    runFrames(api, 2);

    expect(engine.scenes.get(sceneId)?.entities.has(parentId)).toBe(false);
    expect(engine.scenes.get(sceneId)?.entities.has(childId)).toBe(false);

    const port = getPhysicsPort(engine, sceneId)!;
    const hit = port.raycast({
      origin: { x: 0, y: 5, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 10,
    });
    expect(hit).not.toBeNull();
    expect(hit!.entityId).toBe(floorId);
  });

  it('deep hierarchy: root RB + child collider + grandchild collider, raycast returns body owner', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const rootId = createEntityId('root');
    const childId = createEntityId('child');
    const grandchildId = createEntityId('grandchild');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });

    const root = createEntity(rootId);
    const child = createEntity(childId);
    const grandchild = createEntity(grandchildId);
    addChild(root, child);
    addChild(child, grandchild);
    api.scene(sceneId).addEntity({ entity: root });

    setEntityPosition(engine, sceneId, rootId, 0, 2, 0);
    setEntityPosition(engine, sceneId, childId, 0.3, 0, 0);
    setEntityPosition(engine, sceneId, grandchildId, -0.3, 0, 0);

    api.scene(sceneId).entity(rootId).addComponent({
      component: createComponent('rigidBody', { bodyType: 'static' }),
    });
    api.scene(sceneId).entity(childId).addComponent({
      component: createComponent('boxCollider', { halfExtents: { x: 0.2, y: 0.2, z: 0.2 } }),
    });
    api.scene(sceneId).entity(grandchildId).addComponent({
      component: createComponent('sphereCollider', { radius: 0.2 }),
    });
    runFrames(api, 2);

    const port = getPhysicsPort(engine, sceneId)!;
    const hitCenter = port.raycast({
      origin: { x: 0, y: 3, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 2,
    });
    expect(hitCenter).not.toBeNull();
    expect(hitCenter!.entityId).toBe(rootId);

    const hitFromAbove = port.raycast({
      origin: { x: 0.35, y: 3, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      maxDistance: 2,
    });
    expect(hitFromAbove).not.toBeNull();
    expect(hitFromAbove!.entityId).toBe(rootId);
  });

  it('terrain collider can be added (edge case) and update does not throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const terrainId = createEntityId('terrain');

    addSceneWithEntity(api, sceneId, terrainId);
    expect(
      api.scene(sceneId).entity(terrainId).addComponent({
        component: createComponent('rigidBody', { bodyType: 'static' }),
      }).ok,
    ).toBe(true);
    expect(
      api.scene(sceneId).entity(terrainId).addComponent({
        component: createComponent('terrainCollider', {
          heightfield: { columns: 2, rows: 2, heights: [0, 0, 0, 0], size: { x: 10, z: 10 } },
        }),
      }).ok,
    ).toBe(true);
    setEntityPosition(engine, sceneId, terrainId, 0, 0, 0);
    expect(() => runFrames(api, 3)).not.toThrow();
  });
});

describe('Physics all collider types', () => {
  const colliderTypes: Array<
    | { type: 'boxCollider'; props?: object }
    | { type: 'sphereCollider'; props?: object }
    | { type: 'capsuleCollider'; props?: object }
    | { type: 'cylinderCollider'; props?: object }
    | { type: 'coneCollider'; props?: object }
  > = [
    { type: 'boxCollider', props: { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } } },
    { type: 'sphereCollider', props: { radius: 0.5 } },
    { type: 'capsuleCollider', props: { radius: 0.4, halfHeight: 0.5 } },
    { type: 'cylinderCollider', props: { radius: 0.4, halfHeight: 0.5 } },
    { type: 'coneCollider', props: { radius: 0.4, halfHeight: 0.5 } },
  ];

  colliderTypes.forEach(({ type, props = {} }) => {
    it(`${type}: rigidBody + collider runs and raycast hits`, async () => {
      const { api, engine } = await setupPhysicsIntegrationTest();
      const sceneId = createSceneId('main');
      const floorId = createEntityId('floor');
      const shapeId = createEntityId('shape');

      addSceneWithEntity(api, sceneId, floorId);
      addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
      addSceneWithEntity(api, sceneId, shapeId);
      setEntityPosition(engine, sceneId, shapeId, 0, 2, 0);
      api.scene(sceneId).entity(shapeId).addComponent({
        component: createComponent('rigidBody', { bodyType: 'static' }),
      });
      api.scene(sceneId).entity(shapeId).addComponent({
        component: createComponent(type as 'boxCollider', props),
      });
      runFrames(api, 2);

      const port = getPhysicsPort(engine, sceneId)!;
      const hit = port.raycast({
        origin: { x: 0, y: 5, z: 0 },
        direction: { x: 0, y: -1, z: 0 },
        maxDistance: 10,
      });
      expect(hit).not.toBeNull();
      expect(hit!.entityId).toBe(shapeId);
    });
  });

  it('terrainCollider: rigidBody + terrainCollider runs without throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const terrainId = createEntityId('terrain');

    addSceneWithEntity(api, sceneId, terrainId);
    api.scene(sceneId).entity(terrainId).addComponent({
      component: createComponent('rigidBody', { bodyType: 'static' }),
    });
    api.scene(sceneId).entity(terrainId).addComponent({
      component: createComponent('terrainCollider', {
        heightfield: { columns: 2, rows: 2, heights: [0, 0, 0, 0], size: { x: 10, z: 10 } },
      }),
    });
    setEntityPosition(engine, sceneId, terrainId, 0, 0, 0);
    expect(() => runFrames(api, 5)).not.toThrow();
  });
});

describe('Physics collider and rigidBody options', () => {
  it('isSensor: collider with isSensor true runs and getCollisionEvents returns array', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const sensorId = createEntityId('sensor');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, sensorId);
    setEntityPosition(engine, sceneId, sensorId, 0, 2, 0);
    api.scene(sceneId).entity(sensorId).addComponent({
      component: createComponent('rigidBody', { bodyType: 'static' }),
    });
    api.scene(sceneId).entity(sensorId).addComponent({
      component: createComponent('boxCollider', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, isSensor: true }),
    });
    runFrames(api, 10);

    const events = getCollisionEvents(engine, sceneId);
    expect(Array.isArray(events)).toBe(true);
  });

  it('friction and restitution: setField on collider, sync and runFrames do not throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    runFrames(api, 2);

    const scene = api.scene(sceneId);
    expect(scene.entity(boxId).component('boxCollider').setField({ fieldKey: 'friction', value: 0.8 }).ok).toBe(true);
    expect(scene.entity(boxId).component('boxCollider').setField({ fieldKey: 'restitution', value: 0.3 }).ok).toBe(true);
    expect(() => runFrames(api, 20)).not.toThrow();
    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
  });

  it('startSleeping: rigidBody with startSleeping true runs without throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    api.scene(sceneId).entity(boxId).addComponent({
      component: createComponent('rigidBody', { bodyType: 'dynamic', startSleeping: true }),
    });
    api.scene(sceneId).entity(boxId).addComponent({
      component: createComponent('boxCollider', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }),
    });
    setEntityPosition(engine, sceneId, boxId, 0, 1, 0);
    expect(() => runFrames(api, 30)).not.toThrow();
    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
  });

  it('linearDamping and angularDamping: setField on rigidBody, sync and runFrames do not throw', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 2, 0);
    runFrames(api, 2);

    const scene = api.scene(sceneId);
    expect(scene.entity(boxId).component('rigidBody').setField({ fieldKey: 'linearDamping', value: 0.5 }).ok).toBe(true);
    expect(scene.entity(boxId).component('rigidBody').setField({ fieldKey: 'angularDamping', value: 0.5 }).ok).toBe(true);
    expect(() => runFrames(api, 20)).not.toThrow();
    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
  });

  it('gravity component: scene gravity applied, dynamic body falls', async () => {
    const { api, engine } = await setupPhysicsIntegrationTest();
    const sceneId = createSceneId('main');
    const floorId = createEntityId('floor');
    const gravityHolderId = createEntityId('gravityHolder');
    const boxId = createEntityId('box');

    addSceneWithEntity(api, sceneId, floorId);
    addEntityWithStaticFloor(api, sceneId, floorId, { x: 5, y: 0.5, z: 5 });
    addSceneWithEntity(api, sceneId, gravityHolderId);
    api.scene(sceneId).entity(gravityHolderId).addComponent({
      component: createComponent('gravity', { x: 0, y: -5, z: 0 }),
    });
    addSceneWithEntity(api, sceneId, boxId);
    addEntityWithRigidBody(api, sceneId, boxId, { bodyType: 'dynamic', withBoxCollider: true });
    setEntityPosition(engine, sceneId, boxId, 0, 4, 0);

    runFrames(api, 60);
    const pos = getEntityWorldPosition(engine, sceneId, boxId);
    expect(pos).toBeDefined();
    expect(pos!.y).toBeLessThan(4);
  });
});

