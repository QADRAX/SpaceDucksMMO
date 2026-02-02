import {
  ConeColliderComponent,
  CylinderColliderComponent,
  Entity,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/ecs";
import RapierPhysicsSystem from "./RapierPhysicsSystem";
import { initRapier } from "./rapier/RapierInit";

describe("RapierPhysicsSystem collisions", () => {
  beforeAll(async () => {
    await initRapier();
  });

  it("emits enter/stay/exit when kinematic collider overlaps", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const a = new Entity("A");
    a.transform.setPosition(0, 0, 0);
    a.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    a.addComponent(new SphereColliderComponent({ radius: 1 }));

    const b = new Entity("B");
    b.transform.setPosition(10, 0, 0);
    b.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    b.addComponent(new SphereColliderComponent({ radius: 1 }));

    sys.addEntity(a);
    sys.addEntity(b);

    const events: Array<{ kind: string; a: string; b: string }> = [];
    sys.subscribeCollisions?.((ev) => {
      // Normalize order for easier asserts.
      const ids = [ev.a, ev.b].sort();
      events.push({ kind: ev.kind, a: ids[0], b: ids[1] });
    });

    // Use a dt slightly above 1/60s so at least one fixed step runs.
    sys.update(17);
    expect(events.length).toBe(0);

    // Move into overlap (distance < 2).
    b.transform.setPosition(1.5, 0, 0);
    sys.update(17);

    expect(events.some((e) => e.kind === "enter" && e.a === "A" && e.b === "B")).toBe(true);

    // Next step without moving should include at least one stay.
    sys.update(17);
    expect(events.some((e) => e.kind === "stay" && e.a === "A" && e.b === "B")).toBe(true);

    // Move away to end overlap.
    b.transform.setPosition(10, 0, 0);
    sys.update(17);
    expect(events.some((e) => e.kind === "exit" && e.a === "A" && e.b === "B")).toBe(true);

    sys.dispose();
  });

  it("emits enter/stay/exit for cylinder colliders", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const a = new Entity("A");
    a.transform.setPosition(0, 0, 0);
    a.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    a.addComponent(new CylinderColliderComponent({ radius: 1, halfHeight: 1 }));

    const b = new Entity("B");
    b.transform.setPosition(10, 0, 0);
    b.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    b.addComponent(new CylinderColliderComponent({ radius: 1, halfHeight: 1 }));

    sys.addEntity(a);
    sys.addEntity(b);

    const events: Array<{ kind: string; a: string; b: string }> = [];
    sys.subscribeCollisions?.((ev) => {
      const ids = [ev.a, ev.b].sort();
      events.push({ kind: ev.kind, a: ids[0], b: ids[1] });
    });

    sys.update(17);
    expect(events.length).toBe(0);

    b.transform.setPosition(1.5, 0, 0);
    sys.update(17);
    expect(events.some((e) => e.kind === "enter" && e.a === "A" && e.b === "B")).toBe(true);

    sys.update(17);
    expect(events.some((e) => e.kind === "stay" && e.a === "A" && e.b === "B")).toBe(true);

    b.transform.setPosition(10, 0, 0);
    sys.update(17);
    expect(events.some((e) => e.kind === "exit" && e.a === "A" && e.b === "B")).toBe(true);

    sys.dispose();
  });

  it("emits enter/stay/exit for cone colliders", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const a = new Entity("A");
    a.transform.setPosition(0, 0, 0);
    a.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    a.addComponent(new ConeColliderComponent({ radius: 1, halfHeight: 1 }));

    const b = new Entity("B");
    b.transform.setPosition(10, 0, 0);
    b.addComponent(new RigidBodyComponent({ bodyType: "kinematic" }));
    b.addComponent(new ConeColliderComponent({ radius: 1, halfHeight: 1 }));

    sys.addEntity(a);
    sys.addEntity(b);

    const events: Array<{ kind: string; a: string; b: string }> = [];
    sys.subscribeCollisions?.((ev) => {
      const ids = [ev.a, ev.b].sort();
      events.push({ kind: ev.kind, a: ids[0], b: ids[1] });
    });

    sys.update(17);
    expect(events.length).toBe(0);

    b.transform.setPosition(1.5, 0, 0);
    sys.update(17);
    expect(events.some((e) => e.kind === "enter" && e.a === "A" && e.b === "B")).toBe(true);

    sys.update(17);
    expect(events.some((e) => e.kind === "stay" && e.a === "A" && e.b === "B")).toBe(true);

    b.transform.setPosition(10, 0, 0);
    sys.update(17);
    expect(events.some((e) => e.kind === "exit" && e.a === "A" && e.b === "B")).toBe(true);

    sys.dispose();
  });
});
