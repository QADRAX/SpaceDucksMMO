import {
  BoxColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  Entity,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("Rapier Physics - Collision Detection", () => {
  it("detects collisions between sphere and box colliders", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const box = new Entity("box");
      box.transform.setPosition(0, 0, 0);
      box.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      box.addComponent(new BoxColliderComponent({ halfExtents: { x: 1, y: 1, z: 1 } }));

      const sphere = new Entity("sphere");
      sphere.transform.setPosition(3, 0, 0);
      sphere.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      sphere.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(box);
      scaffold.addEntity(sphere);

      const collisions: any[] = [];
      const unsubscribe = scaffold.scene.collisionEvents.onEntity("sphere", (ev) => {
        collisions.push(ev);
      });

      scaffold.runFrames(1, 17);
      expect(collisions.length).toBe(0);

      sphere.transform.setPosition(1.2, 0, 0);
      scaffold.runFrames(2, 17);

      const enter = collisions.find((c) => c.kind === "enter");
      expect(enter).toBeDefined();
      expect(enter?.other).toBe("box");

      unsubscribe();
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions between cylinder and cone colliders", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const cylinder = new Entity("cylinder");
      cylinder.transform.setPosition(0, 0, 0);
      cylinder.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      cylinder.addComponent(new CylinderColliderComponent({ radius: 1, halfHeight: 1 }));

      const cone = new Entity("cone");
      cone.transform.setPosition(2.5, 0, 0);
      cone.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      cone.addComponent(new ConeColliderComponent({ radius: 1, halfHeight: 1 }));

      scaffold.addEntity(cylinder);
      scaffold.addEntity(cone);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("cone", (ev) => collisions.push(ev));

      cone.transform.setPosition(1.5, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions with mixed collider type combinations", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const box = new Entity("box");
      box.transform.setPosition(0, 0, 0);
      box.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      box.addComponent(new BoxColliderComponent({ halfExtents: { x: 1, y: 1, z: 1 } }));

      const cone = new Entity("cone");
      cone.transform.setPosition(3, 0, 0);
      cone.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      cone.addComponent(new ConeColliderComponent({ radius: 0.5, halfHeight: 1 }));

      scaffold.addEntity(box);
      scaffold.addEntity(cone);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("cone", (ev) => collisions.push(ev));

      cone.transform.setPosition(1.3, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions between two spheres", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const sphere1 = new Entity("sphere1");
      sphere1.transform.setPosition(0, 0, 0);
      sphere1.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      sphere1.addComponent(new SphereColliderComponent({ radius: 1 }));

      const sphere2 = new Entity("sphere2");
      sphere2.transform.setPosition(3, 0, 0);
      sphere2.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      sphere2.addComponent(new SphereColliderComponent({ radius: 0.8 }));

      scaffold.addEntity(sphere1);
      scaffold.addEntity(sphere2);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("sphere2", (ev) => collisions.push(ev));

      sphere2.transform.setPosition(1.6, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions between two boxes", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const box1 = new Entity("box1");
      box1.transform.setPosition(0, 0, 0);
      box1.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      box1.addComponent(new BoxColliderComponent({ halfExtents: { x: 1, y: 1, z: 1 } }));

      const box2 = new Entity("box2");
      box2.transform.setPosition(3, 0, 0);
      box2.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      box2.addComponent(new BoxColliderComponent({ halfExtents: { x: 0.8, y: 0.8, z: 0.8 } }));

      scaffold.addEntity(box1);
      scaffold.addEntity(box2);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("box2", (ev) => collisions.push(ev));

      box2.transform.setPosition(1.7, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions with flat box (thin plane)", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      // Flat horizontal box (very thin in Y)
      const flatBox = new Entity("flatBox");
      flatBox.transform.setPosition(0, 0, 0);
      flatBox.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      flatBox.addComponent(new BoxColliderComponent({ halfExtents: { x: 5, y: 0.1, z: 5 } }));

      const sphere = new Entity("sphere");
      sphere.transform.setPosition(0, 2, 0);
      sphere.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      sphere.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(flatBox);
      scaffold.addEntity(sphere);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("sphere", (ev) => collisions.push(ev));

      sphere.transform.setPosition(0, 0.4, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions between sphere and cylinder", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const cylinder = new Entity("cylinder");
      cylinder.transform.setPosition(0, 0, 0);
      cylinder.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      cylinder.addComponent(new CylinderColliderComponent({ radius: 1, halfHeight: 2 }));

      const sphere = new Entity("sphere");
      sphere.transform.setPosition(3, 0, 0);
      sphere.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      sphere.addComponent(new SphereColliderComponent({ radius: 0.6 }));

      scaffold.addEntity(cylinder);
      scaffold.addEntity(sphere);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("sphere", (ev) => collisions.push(ev));

      sphere.transform.setPosition(1.5, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });

  it("detects collisions between box and cylinder", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const cylinder = new Entity("cylinder");
      cylinder.transform.setPosition(0, 0, 0);
      cylinder.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      cylinder.addComponent(new CylinderColliderComponent({ radius: 0.8, halfHeight: 1.5 }));

      const box = new Entity("box");
      box.transform.setPosition(3, 0, 0);
      box.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      box.addComponent(new BoxColliderComponent({ halfExtents: { x: 0.7, y: 0.7, z: 0.7 } }));

      scaffold.addEntity(cylinder);
      scaffold.addEntity(box);

      const collisions: any[] = [];
      scaffold.scene.collisionEvents.onEntity("box", (ev) => collisions.push(ev));

      box.transform.setPosition(1.4, 0, 0);
      scaffold.runFrames(2, 17);

      expect(collisions.some((c) => c.kind === "enter")).toBe(true);
    } finally {
      scaffold.dispose();
    }
  });
});
