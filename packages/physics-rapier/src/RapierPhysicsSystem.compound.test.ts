import { Entity, RigidBodyComponent, SphereColliderComponent } from "@duckengine/ecs";
import RapierPhysicsSystem from "./RapierPhysicsSystem";
import { initRapier } from "./rapier/RapierInit";

describe("RapierPhysicsSystem compound colliders", () => {
  beforeAll(async () => {
    await initRapier();
  });

  it("reports body-owner ids for child colliders (compound) and respects local offset", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const parent = new Entity("P");
    parent.transform.setPosition(0, 0, 0);
    parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

    const childCollider = new Entity("C");
    childCollider.transform.setPosition(5, 0, 0); // local offset from parent
    childCollider.addComponent(new SphereColliderComponent({ radius: 1 }));

    parent.addChild(childCollider);

    const mover = new Entity("B");
    mover.transform.setPosition(10, 0, 0);
    mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    mover.addComponent(new SphereColliderComponent({ radius: 1 }));

    sys.addEntity(parent);
    sys.addEntity(mover);

    const events: any[] = [];
    sys.subscribeCollisions?.((ev) => events.push(ev));

    // step once without overlap
    sys.update(17);
    expect(events.length).toBe(0);

    // move into overlap with child's offset collider at world x=5
    mover.transform.setPosition(5, 0, 0);
    sys.update(17);

    const enter = events.find((e) => e.kind === "enter");
    expect(enter).toBeDefined();

    const bodies = new Set([enter.a, enter.b]);
    const colliders = new Set([enter.colliderA, enter.colliderB]);

    expect(bodies.has("P")).toBe(true);
    expect(bodies.has("B")).toBe(true);
    expect(colliders.has("C")).toBe(true);
    expect(colliders.has("B")).toBe(true);

    // ensure collider id C maps to body owner P (not C)
    if (enter.colliderA === "C") {
      expect(enter.a).toBe("P");
    }
    if (enter.colliderB === "C") {
      expect(enter.b).toBe("P");
    }

    sys.dispose();
  });

  it("reattaches colliders when rigid body is added after colliders already existed", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const parent = new Entity("P");
    parent.transform.setPosition(0, 0, 0);

    const child = new Entity("C");
    child.transform.setPosition(2, 0, 0);
    child.addComponent(new SphereColliderComponent({ radius: 1 }));
    parent.addChild(child);

    const mover = new Entity("B");
    mover.transform.setPosition(10, 0, 0);
    mover.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    mover.addComponent(new SphereColliderComponent({ radius: 1 }));

    sys.addEntity(parent);
    sys.addEntity(mover);

    // Now add rigidbody to parent AFTER adding to system.
    parent.addComponent(new RigidBodyComponent({ bodyType: "static" }));

    const events: any[] = [];
    sys.subscribeCollisions?.((ev) => events.push(ev));

    mover.transform.setPosition(2, 0, 0);
    sys.update(17);

    const enter = events.find((e) => e.kind === "enter");
    expect(enter).toBeDefined();

    // collider C must now report body-owner as P.
    if (enter.colliderA === "C") expect(enter.a).toBe("P");
    if (enter.colliderB === "C") expect(enter.b).toBe("P");

    sys.dispose();
  });
});
