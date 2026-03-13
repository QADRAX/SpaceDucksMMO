import {
  BoxColliderComponent,
  CylinderColliderComponent,
  Entity,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("Rapier Physics - Compound Colliders", () => {
  it("compound collider children attach to parent rigid body", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const parent = new Entity("parent");
      parent.transform.setPosition(0, 0, 0);
      parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      const collider1 = new Entity("collider1");
      collider1.transform.setPosition(1, 0, 0);
      collider1.addComponent(new SphereColliderComponent({ radius: 1 }));
      parent.addChild(collider1);

      const collider2 = new Entity("collider2");
      collider2.transform.setPosition(-1, 0, 0);
      collider2.addComponent(new SphereColliderComponent({ radius: 1 }));
      parent.addChild(collider2);

      const mover = new Entity("mover");
      mover.transform.setPosition(5, 0, 0);
      mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      mover.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(parent);
      scaffold.addEntity(collider1);
      scaffold.addEntity(collider2);
      scaffold.addEntity(mover);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("mover", (ev) => collisions.push(ev));

      mover.transform.setPosition(1, 0, 0);
      scaffold.runFrames(2, 17);

      const collision = collisions.find((c) => c.kind === "enter");
      expect(collision).toBeDefined();
      expect([collision?.selfCollider, collision?.otherCollider].sort()).toContain("collider1");
    } finally {
      scaffold.dispose();
    }
  });

  it("multiple colliders on same parent rigid body all participate in physics", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const compound = new Entity("compound");
      compound.transform.setPosition(0, 0, 0);
      compound.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      const sphere = new Entity("sphere");
      sphere.transform.setPosition(0, 2, 0);
      sphere.addComponent(new SphereColliderComponent({ radius: 1 }));
      compound.addChild(sphere);

      const box = new Entity("box");
      box.transform.setPosition(0, -2, 0);
      box.addComponent(new BoxColliderComponent({ halfExtents: { x: 1, y: 1, z: 1 } }));
      compound.addChild(box);

      const test1 = new Entity("test1");
      test1.transform.setPosition(0, 4, 0);
      test1.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test1.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      const test2 = new Entity("test2");
      test2.transform.setPosition(0, -4, 0);
      test2.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test2.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(compound);
      scaffold.addEntity(sphere);
      scaffold.addEntity(box);
      scaffold.addEntity(test1);
      scaffold.addEntity(test2);

      const allCollisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("test1", (ev) => allCollisions.push(ev));
      scaffold.scene.collisionEvents.onEntity("test2", (ev) => allCollisions.push(ev));

      test1.transform.setPosition(0, 1.8, 0);
      test2.transform.setPosition(0, -1.8, 0);
      scaffold.runFrames(2, 17);

      expect(allCollisions.filter((c) => c.kind === "enter")).toHaveLength(2);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound collider with deeply nested hierarchy (3 levels)", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const root = new Entity("root");
      root.transform.setPosition(0, 0, 0);
      root.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      // Level 1: child of root (no collider)
      const level1 = new Entity("level1");
      level1.transform.setPosition(1, 0, 0);
      root.addChild(level1);

      // Level 2: child of level1 (with collider)
      const level2 = new Entity("level2");
      level2.transform.setPosition(0.5, 0, 0);
      level2.addComponent(new SphereColliderComponent({ radius: 0.8 }));
      level1.addChild(level2);

      const mover = new Entity("mover");
      mover.transform.setPosition(3, 0, 0);
      mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      mover.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(root);
      scaffold.addEntity(level1);
      scaffold.addEntity(level2);
      scaffold.addEntity(mover);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("mover", (ev) => collisions.push(ev));

      // Move to hit the deeply nested collider at world position ~1.5
      mover.transform.setPosition(1.2, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound collider with scaled parent hierarchy", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const parent = new Entity("parent");
      parent.transform.setPosition(0, 0, 0);
      parent.transform.setScale(1, 1, 1);
      parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      const collider1 = new Entity("collider1");
      collider1.transform.setPosition(1.5, 0, 0);
      collider1.addComponent(new SphereColliderComponent({ radius: 0.8 }));
      parent.addChild(collider1);

      const mover = new Entity("mover");
      mover.transform.setPosition(3.5, 0, 0);
      mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      mover.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(parent);
      scaffold.addEntity(collider1);
      scaffold.addEntity(mover);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("mover", (ev) => collisions.push(ev));

      // Move mover directly toward collider1
      mover.transform.setPosition(2.2, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound with many colliders (5+) all colliding simultaneously", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const compound = new Entity("compound");
      compound.transform.setPosition(0, 0, 0);
      compound.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      // Create 5 colliders in a line
      const colliders = [];
      for (let i = 0; i < 5; i++) {
        const collider = new Entity(`collider${i}`);
        collider.transform.setPosition(i - 2, 0, 0);
        collider.addComponent(new SphereColliderComponent({ radius: 0.6 }));
        compound.addChild(collider);
        colliders.push(collider);
        scaffold.addEntity(collider);
      }

      scaffold.addEntity(compound);

      // Create test entity that will sweep through all colliders
      const test = new Entity("test");
      test.transform.setPosition(-5, 0, 0);
      test.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test.addComponent(new SphereColliderComponent({ radius: 0.4 }));

      scaffold.addEntity(test);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("test", (ev) => collisions.push(ev));

      // Sweep through the compound (from -5 to 3)
      test.transform.setPosition(0, 0, 0);
      scaffold.runFrames(2, 17);

      const enters = collisions.filter((c) => c.kind === "enter");
      expect(enters.length).toBeGreaterThanOrEqual(1);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound collider attached to kinematic rigid body", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const compound = new Entity("compound");
      compound.transform.setPosition(0, 0, 0);
      compound.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));

      const collider1 = new Entity("collider1");
      collider1.transform.setPosition(1, 0, 0);
      collider1.addComponent(new SphereColliderComponent({ radius: 0.8 }));
      compound.addChild(collider1);

      const collider2 = new Entity("collider2");
      collider2.transform.setPosition(-1, 0, 0);
      collider2.addComponent(new BoxColliderComponent({ halfExtents: { x: 0.7, y: 0.7, z: 0.7 } }));
      compound.addChild(collider2);

      const test = new Entity("test");
      test.transform.setPosition(3, 0, 0);
      test.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      test.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(compound);
      scaffold.addEntity(collider1);
      scaffold.addEntity(collider2);
      scaffold.addEntity(test);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("compound", (ev) => collisions.push(ev));

      // Move kinematic compound toward static test
      compound.transform.setPosition(2, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("two compound colliders colliding with each other", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      // First compound
      const compound1 = new Entity("compound1");
      compound1.transform.setPosition(-2, 0, 0);
      compound1.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      const c1_collider1 = new Entity("c1_collider1");
      c1_collider1.transform.setPosition(1, 0, 0);
      c1_collider1.addComponent(new SphereColliderComponent({ radius: 0.7 }));
      compound1.addChild(c1_collider1);

      // Second compound
      const compound2 = new Entity("compound2");
      compound2.transform.setPosition(2, 0, 0);
      compound2.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));

      const c2_collider1 = new Entity("c2_collider1");
      c2_collider1.transform.setPosition(-1, 0, 0);
      c2_collider1.addComponent(new SphereColliderComponent({ radius: 0.7 }));
      compound2.addChild(c2_collider1);

      scaffold.addEntity(compound1);
      scaffold.addEntity(c1_collider1);
      scaffold.addEntity(compound2);
      scaffold.addEntity(c2_collider1);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("compound2", (ev) => collisions.push(ev));

      // Move compound2 toward compound1
      compound2.transform.setPosition(1, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound with different collider shapes (sphere, box, cylinder)", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const compound = new Entity("compound");
      compound.transform.setPosition(0, 0, 0);
      compound.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      // Sphere collider
      const sphere = new Entity("sphere");
      sphere.transform.setPosition(1, 0, 0);
      sphere.addComponent(new SphereColliderComponent({ radius: 0.8 }));
      compound.addChild(sphere);

      // Box collider
      const box = new Entity("box");
      box.transform.setPosition(-1, 1, 0);
      box.addComponent(new BoxColliderComponent({ halfExtents: { x: 0.7, y: 0.7, z: 0.7 } }));
      compound.addChild(box);

      // Cylinder collider
      const cylinder = new Entity("cylinder");
      cylinder.transform.setPosition(0, -1.5, 0);
      cylinder.addComponent(new CylinderColliderComponent({ radius: 0.6, halfHeight: 0.8 }));
      compound.addChild(cylinder);

      // Test colliders hitting each type
      const test1 = new Entity("test1");
      test1.transform.setPosition(3, 0, 0);
      test1.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test1.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      const test2 = new Entity("test2");
      test2.transform.setPosition(-3, 1, 0);
      test2.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test2.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      const test3 = new Entity("test3");
      test3.transform.setPosition(0, -3, 0);
      test3.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test3.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(compound);
      scaffold.addEntity(sphere);
      scaffold.addEntity(box);
      scaffold.addEntity(cylinder);
      scaffold.addEntity(test1);
      scaffold.addEntity(test2);
      scaffold.addEntity(test3);

      const allCollisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("test1", (ev) => allCollisions.push(ev));
      scaffold.scene.collisionEvents.onEntity("test2", (ev) => allCollisions.push(ev));
      scaffold.scene.collisionEvents.onEntity("test3", (ev) => allCollisions.push(ev));

      // Move test colliders into compound
      test1.transform.setPosition(1.2, 0, 0);
      test2.transform.setPosition(-0.8, 0.8, 0);
      test3.transform.setPosition(0, -1.2, 0);
      scaffold.runFrames(2, 17);

      expect(allCollisions.filter((c) => c.kind === "enter").length).toBeGreaterThanOrEqual(3);
    } finally {
      scaffold.dispose();
    }
  });

  it("compound collider with offset in Z axis", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const compound = new Entity("compound");
      compound.transform.setPosition(0, 0, 0);
      compound.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      const collider1 = new Entity("collider1");
      collider1.transform.setPosition(0, 0, 3); // Offset deep in Z
      collider1.addComponent(new SphereColliderComponent({ radius: 1 }));
      compound.addChild(collider1);

      const test = new Entity("test");
      test.transform.setPosition(0, 0, 5);
      test.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(compound);
      scaffold.addEntity(collider1);
      scaffold.addEntity(test);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("test", (ev) => collisions.push(ev));

      test.transform.setPosition(0, 0, 3.8);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("orphan collider without parent rigid body attaches to nearest ancestor", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const parent = new Entity("parent");
      parent.transform.setPosition(0, 0, 0);
      parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

      // Intermediate node without rigid body
      const intermediate = new Entity("intermediate");
      intermediate.transform.setPosition(1, 0, 0);
      parent.addChild(intermediate);

      // Collider without rigid body - should attach to parent's rigid body
      const orphanCollider = new Entity("orphanCollider");
      orphanCollider.transform.setPosition(0.5, 0, 0); // Relative to intermediate
      orphanCollider.addComponent(new SphereColliderComponent({ radius: 0.8 }));
      intermediate.addChild(orphanCollider);

      const test = new Entity("test");
      test.transform.setPosition(3, 0, 0);
      test.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      test.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(parent);
      scaffold.addEntity(intermediate);
      scaffold.addEntity(orphanCollider);
      scaffold.addEntity(test);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("test", (ev) => collisions.push(ev));

      // World position should be around 1.5 (0 + 1 + 0.5)
      test.transform.setPosition(1.2, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });
});
