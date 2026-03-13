import { Entity, GravityComponent, RigidBodyComponent, SphereColliderComponent } from "@duckengine/core";
import RapierPhysicsSystem from "./RapierPhysicsSystem";
import { initRapier } from "./rapier/RapierInit";

describe("RapierPhysicsSystem gravity", () => {
  beforeAll(async () => {
    await initRapier();
  });

  it("uses no gravity when no GravityComponent exists", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const d = new Entity("D");
    d.transform.setPosition(0, 0, 0);
    d.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);
    d.addComponent(new SphereColliderComponent({ radius: 0.5 }) as any);

    sys.addEntity(d);
    sys.update(17);

    // With 0g default, the body should not move vertically (within float tolerance).
    expect(d.transform.worldPosition.y).toBeCloseTo(0, 6);
    sys.dispose();
  });

  it("uses GravityComponent to override world gravity", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const g = new Entity("G");
    g.addComponent(new GravityComponent({ gravity: [0, 9.81, 0] }) as any);

    const d = new Entity("D");
    d.transform.setPosition(0, 0, 0);
    d.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);
    d.addComponent(new SphereColliderComponent({ radius: 0.5 }) as any);

    sys.addEntity(g);
    sys.addEntity(d);
    sys.update(17);

    expect(d.transform.worldPosition.y).toBeGreaterThan(0);
    sys.dispose();
  });

  it("returns to 0g when GravityComponent is removed", () => {
    const sys = new RapierPhysicsSystem();
    sys.configureTimestep?.({ fixedStepSeconds: 1 / 60, maxSubSteps: 1 });

    const g = new Entity("G");
    g.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }) as any);

    const d = new Entity("D");
    d.transform.setPosition(0, 0, 0);
    d.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);
    d.addComponent(new SphereColliderComponent({ radius: 0.5 }) as any);

    sys.addEntity(g);
    sys.addEntity(d);
    sys.update(17);

    expect(d.transform.worldPosition.y).toBeLessThan(0);

    // Remove gravity and ensure subsequent steps don't continue accelerating downward.
    sys.removeEntity(g.id);
    const v0 = sys.getLinearVelocity?.(d.id)?.y ?? 0;
    for (let i = 0; i < 5; i++) sys.update(17);
    const v1 = sys.getLinearVelocity?.(d.id)?.y ?? 0;

    // Without gravity, inertia remains but there should be no additional downward acceleration.
    expect(v1).toBeCloseTo(v0, 4);
    sys.dispose();
  });
});
