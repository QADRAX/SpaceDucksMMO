import { RapierEcsUpdateCoordinator } from "./RapierEcsUpdateCoordinator";

function makeEntity(opts: {
  id: string;
  rigidBody?: any;
  collider?: any;
  children?: any[];
  parent?: any;
  pos?: { x: number; y: number; z: number };
  rot?: { x: number; y: number; z: number };
}) {
  const transform = {
    worldPosition: opts.pos ?? { x: 0, y: 0, z: 0 },
    worldRotation: opts.rot ?? { x: 0, y: 0, z: 0 },
  };

  return {
    id: opts.id,
    parent: opts.parent,
    transform,
    getComponent: (type: string) => {
      if (type === "rigidBody") return opts.rigidBody;
      return undefined;
    },
    getChildren: () => opts.children ?? [],
  } as any;
}

describe("RapierEcsUpdateCoordinator", () => {
  test("updates rigid-body params in-place when bodyType unchanged", () => {
    const R: any = {};
    const world: any = {};

    const rb = {
      bodyType: "dynamic",
      linearDamping: 1,
      angularDamping: 2,
      gravityScale: 0.5,
      mass: 10,
      startSleeping: false,
    };

    const ent = makeEntity({ id: "e1", rigidBody: rb });

    const body = {
      setLinearDamping: jest.fn(),
      setAngularDamping: jest.fn(),
      setGravityScale: jest.fn(),
      setAdditionalMass: jest.fn(),
      wakeUp: jest.fn(),
      sleep: jest.fn(),
    };

    const bodies = {
      bodyByEntity: new Map([["e1", body]]),
      ensureRigidBody: jest.fn(),
      removeEntityBody: jest.fn((_: any, id: string) => {
        bodies.bodyByEntity.delete(id);
      }),
    };

    const colliders = {
      colliderByEntity: new Map(),
      getColliderComponent: jest.fn(() => undefined),
      ensureCollider: jest.fn(),
      removeEntityCollider: jest.fn(),
      removeCollidersInSubtree: jest.fn(),
      ensureCollidersInSubtree: jest.fn(),
      findNearestRigidBodyOwner: jest.fn(() => null),
    };

    const getEntity = (id: string) => (id === "e1" ? ent : null);

    const u = new RapierEcsUpdateCoordinator(R, world, bodies as any, colliders as any, getEntity);

    u.onComponentChanged("e1", "rigidBody");
    u.flushPendingUpdates();

    expect(colliders.removeCollidersInSubtree).not.toHaveBeenCalled();
    expect(bodies.removeEntityBody).not.toHaveBeenCalled();
    expect(bodies.ensureRigidBody).not.toHaveBeenCalled();

    expect(body.setLinearDamping).toHaveBeenCalledWith(1);
    expect(body.setAngularDamping).toHaveBeenCalledWith(2);
    expect(body.setGravityScale).toHaveBeenCalledWith(0.5, true);
    expect(body.setAdditionalMass).toHaveBeenCalledWith(10, true);
    expect(body.wakeUp).toHaveBeenCalled();
    expect(body.sleep).not.toHaveBeenCalled();
  });

  test("rebuilds rigid-body when bodyType changes", () => {
    const R: any = {};
    const world: any = {};

    const rb = {
      bodyType: "dynamic",
      startSleeping: false,
    };

    const ent = makeEntity({ id: "e1", rigidBody: rb });

    const bodies = {
      bodyByEntity: new Map([
        [
          "e1",
          {
            wakeUp: jest.fn(),
            sleep: jest.fn(),
          },
        ],
      ]),
      ensureRigidBody: jest.fn(),
      removeEntityBody: jest.fn((_: any, id: string) => {
        bodies.bodyByEntity.delete(id);
      }),
    };

    const colliders = {
      colliderByEntity: new Map(),
      getColliderComponent: jest.fn(() => undefined),
      ensureCollider: jest.fn(),
      removeEntityCollider: jest.fn(),
      removeCollidersInSubtree: jest.fn(),
      ensureCollidersInSubtree: jest.fn(),
      findNearestRigidBodyOwner: jest.fn(() => null),
    };

    const getEntity = (id: string) => (id === "e1" ? ent : null);

    const u = new RapierEcsUpdateCoordinator(R, world, bodies as any, colliders as any, getEntity);

    // Seed snapshot.
    u.onComponentChanged("e1", "rigidBody");
    u.flushPendingUpdates();

    rb.bodyType = "static";
    u.onComponentChanged("e1", "rigidBody");
    u.flushPendingUpdates();

    expect(colliders.removeCollidersInSubtree).toHaveBeenCalledTimes(1);
    expect(bodies.removeEntityBody).toHaveBeenCalledTimes(1);
    expect(bodies.ensureRigidBody).toHaveBeenCalledTimes(1);
    expect(colliders.ensureCollidersInSubtree).toHaveBeenCalledTimes(1);
  });

  test("updates collider material in-place when shape unchanged", () => {
    const R: any = {};
    const world: any = {};

    const col = {
      type: "sphereCollider",
      radius: 1,
      friction: 0.2,
      restitution: 0.1,
      isSensor: false,
    };

    const ent = makeEntity({ id: "e1" });

    const collider = {
      setFriction: jest.fn(),
      setRestitution: jest.fn(),
      setSensor: jest.fn(),
    };

    const bodies = {
      bodyByEntity: new Map(),
      ensureRigidBody: jest.fn(),
      removeEntityBody: jest.fn(),
    };

    const colliders = {
      colliderByEntity: new Map([["e1", collider]]),
      getColliderComponent: jest.fn(() => col),
      ensureCollider: jest.fn(),
      removeEntityCollider: jest.fn(),
      removeCollidersInSubtree: jest.fn(),
      ensureCollidersInSubtree: jest.fn(),
      findNearestRigidBodyOwner: jest.fn(() => null),
    };

    const getEntity = (id: string) => (id === "e1" ? ent : null);

    const u = new RapierEcsUpdateCoordinator(R, world, bodies as any, colliders as any, getEntity);

    // First edit seeds signatures (no rebuild, no updates expected).
    u.onComponentChanged("e1", "sphereCollider");
    u.flushPendingUpdates();

    // Second edit changes friction -> in-place update.
    col.friction = 0.9;
    u.onComponentChanged("e1", "sphereCollider");
    u.flushPendingUpdates();

    expect(colliders.removeEntityCollider).not.toHaveBeenCalled();
    expect(colliders.ensureCollider).not.toHaveBeenCalled();

    expect(collider.setFriction).toHaveBeenCalledWith(0.9);
    expect(collider.setRestitution).toHaveBeenCalledWith(0.1);
    expect(collider.setSensor).toHaveBeenCalledWith(false);
  });
});
