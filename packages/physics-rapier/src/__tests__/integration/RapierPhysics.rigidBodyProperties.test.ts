import {
  BoxColliderComponent,
  Entity,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("Rapier Physics - Rigid Body Properties", () => {
  it("applies dynamic body with correct mass and gravity", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));

      const dynamic = new Entity("dynamic");
      dynamic.transform.setPosition(0, 5, 0);
      dynamic.addComponent(
        new RigidBodyComponent({ bodyType: "dynamic", mass: 2.0 })
      );
      dynamic.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(gravity);
      scaffold.addEntity(dynamic);

      const initialY = dynamic.transform.worldPosition.y;
      scaffold.runFrames(120, 17);
      const finalY = dynamic.transform.worldPosition.y;

      expect(finalY).toBeLessThan(initialY - 2);
    } finally {
      scaffold.dispose();
    }
  });

  it("applies kinematic body properties (no gravity)", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));

      const kinematic = new Entity("kinematic");
      kinematic.transform.setPosition(0, 5, 0);
      kinematic.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      kinematic.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(gravity);
      scaffold.addEntity(kinematic);

      const initialY = kinematic.transform.worldPosition.y;
      scaffold.runFrames(120, 17);
      const finalY = kinematic.transform.worldPosition.y;

      expect(finalY).toBeCloseTo(initialY, 1);
    } finally {
      scaffold.dispose();
    }
  });

  it("applies collider friction and restitution", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));

      const ground = new Entity("ground");
      ground.transform.setPosition(0, 0, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(
        new BoxColliderComponent({ halfExtents: { x: 10, y: 1, z: 10 }, friction: 0.7, restitution: 0.2 })
      );

      const ball = new Entity("ball");
      ball.transform.setPosition(0, 3, 0);
      ball.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      ball.addComponent(
        new SphereColliderComponent({ radius: 0.5, friction: 0.1, restitution: 0.3 })
      );

      scaffold.addEntity(gravity);
      scaffold.addEntity(ground);
      scaffold.addEntity(ball);

      scaffold.runFrames(250, 17);

      const endY = ball.transform.worldPosition.y;
      expect(endY).toBeGreaterThan(0.4);
      expect(endY).toBeLessThan(1.5);
    } finally {
      scaffold.dispose();
    }
  });
});
