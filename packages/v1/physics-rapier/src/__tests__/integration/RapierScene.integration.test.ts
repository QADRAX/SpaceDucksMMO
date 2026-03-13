import {
  BoxColliderComponent,
  Entity,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("Rapier scene integration", () => {
  it("simulates gravity and collisions through BaseScene update loop", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));

      const ground = new Entity("ground");
      ground.transform.setPosition(0, -1, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 10, y: 1, z: 10 } }));

      const duck = new Entity("duck");
      duck.transform.setPosition(0, 3, 0);
      duck.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      duck.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(gravity);
      scaffold.addEntity(ground);
      scaffold.addEntity(duck);

      const kinds: string[] = [];
      const unsubscribe = scaffold.scene.collisionEvents.onEntity("duck", (ev) => {
        if (ev.other === "ground") {
          kinds.push(ev.kind);
        }
      });

      scaffold.runFrames(180, 17);

      expect(duck.transform.worldPosition.y).toBeLessThan(3);
      expect(kinds).toContain("enter");

      unsubscribe();
    } finally {
      scaffold.dispose();
    }
  });

  it("propagates transform edits from scene entities into Rapier simulation", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      const anchor = new Entity("anchor");
      anchor.transform.setPosition(0, 0, 0);
      anchor.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      anchor.addComponent(new SphereColliderComponent({ radius: 1 }));

      const mover = new Entity("mover");
      mover.transform.setPosition(6, 0, 0);
      mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
      mover.addComponent(new SphereColliderComponent({ radius: 1 }));

      scaffold.addEntity(anchor);
      scaffold.addEntity(mover);

      const kinds: string[] = [];
      const unsubscribe = scaffold.scene.collisionEvents.onEntityEnter("mover", (ev) => {
        if (ev.other === "anchor") {
          kinds.push(ev.kind);
        }
      });

      scaffold.runFrames(1, 17);
      expect(kinds.length).toBe(0);

      mover.transform.setPosition(1.2, 0, 0);
      scaffold.runFrames(2, 17);

      expect(kinds).toContain("enter");

      unsubscribe();
    } finally {
      scaffold.dispose();
    }
  });
});