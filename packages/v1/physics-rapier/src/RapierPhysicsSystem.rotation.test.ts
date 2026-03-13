import {
  Entity,
  RigidBodyComponent,
  SphereColliderComponent,
  BoxColliderComponent,
} from "@duckengine/core";
import RapierPhysicsSystem from "./RapierPhysicsSystem";
import { initRapier } from "./rapier/RapierInit";

describe("RapierPhysicsSystem rotation & coordinate consistency", () => {
  beforeAll(async () => {
    await initRapier();
  });

  it("uses parent rotation when computing compound collider local pose", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const parent = new Entity("P");
    parent.transform.setPosition(0, 0, 0);
    parent.transform.setRotation(0, Math.PI / 2, 0);
    parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

    const childCollider = new Entity("C");
    childCollider.transform.setPosition(5, 0, 0);
    childCollider.addComponent(new SphereColliderComponent({ radius: 1 }));
    parent.addChild(childCollider);

    const mover = new Entity("B");
    mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    mover.addComponent(new SphereColliderComponent({ radius: 1 }));

    sys.addEntity(parent);
    sys.addEntity(mover);

    const events: any[] = [];
    sys.subscribeCollisions?.((ev) => events.push(ev));

    // Place the mover exactly where the child collider ends up in world-space.
    const wp = childCollider.transform.worldPosition;
    mover.transform.setPosition(wp.x, wp.y, wp.z);
    sys.update(17);

    const enter = events.find((e) => e.kind === "enter");
    expect(enter).toBeDefined();
    const bodies = new Set([enter.a, enter.b]);
    const colliders = new Set([enter.colliderA, enter.colliderB]);
    expect(bodies.has("P")).toBe(true);
    expect(bodies.has("B")).toBe(true);
    expect(colliders.has("C")).toBe(true);
    expect(colliders.has("B")).toBe(true);

    sys.dispose();
  });

  it("applies entity rotation to Rapier rigid bodies (static body rotation affects collision)", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const box = new Entity("Box");
    box.transform.setPosition(0, 0, 0);
    // Rotate 90 degrees around Y: the long axis of the box should rotate away from X.
    box.transform.setRotation(0, Math.PI / 2, 0);
    box.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    box.addComponent(new BoxColliderComponent({ halfExtents: { x: 2, y: 0.5, z: 0.5 } }));

    const sphere = new Entity("Sphere");
    sphere.transform.setPosition(2.4, 0, 0);
    sphere.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    sphere.addComponent(new SphereColliderComponent({ radius: 0.5 }));

    sys.addEntity(box);
    sys.addEntity(sphere);

    const events: any[] = [];
    sys.subscribeCollisions?.((ev) => events.push(ev));

    // If rotation is respected, there should be no collision at x=2.4.
    sys.update(17);
    const enter = events.find((e) => e.kind === "enter");
    expect(enter).toBeUndefined();

    sys.dispose();
  });
});
