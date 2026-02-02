import CollisionEventsHub from "./CollisionEventsHub";
import type { IPhysicsSystem, PhysicsCollisionEvent } from "./index";

describe("CollisionEventsHub", () => {
  it("dispatches entity-scoped callbacks to both sides with normalized self/other", () => {
    let sink: ((ev: PhysicsCollisionEvent) => void) | undefined;

    const physics: IPhysicsSystem = {
      addEntity: () => {},
      removeEntity: () => {},
      update: () => {},
      dispose: () => {},
      subscribeCollisions: (listener) => {
        sink = listener;
        return () => {
          sink = undefined;
        };
      }
    };

    const hub = new CollisionEventsHub();
    hub.attach(physics);

    const receivedA: Array<any> = [];
    const receivedB: Array<any> = [];

    hub.onEntity("A", (ev) => receivedA.push(ev));
    hub.onEntity("B", (ev) => receivedB.push(ev));

    sink?.({ kind: "enter", a: "A", b: "B", colliderA: "A_col", colliderB: "B_col" });

    expect(receivedA.length).toBe(1);
    expect(receivedA[0].self).toBe("A");
    expect(receivedA[0].other).toBe("B");
    expect(receivedA[0].selfCollider).toBe("A_col");
    expect(receivedA[0].otherCollider).toBe("B_col");

    expect(receivedB.length).toBe(1);
    expect(receivedB[0].self).toBe("B");
    expect(receivedB[0].other).toBe("A");
    expect(receivedB[0].selfCollider).toBe("B_col");
    expect(receivedB[0].otherCollider).toBe("A_col");

    hub.dispose();
  });

  it("supports kind-specific entity subscriptions", () => {
    let sink: ((ev: PhysicsCollisionEvent) => void) | undefined;

    const physics: IPhysicsSystem = {
      addEntity: () => {},
      removeEntity: () => {},
      update: () => {},
      dispose: () => {},
      subscribeCollisions: (listener) => {
        sink = listener;
        return () => {
          sink = undefined;
        };
      }
    };

    const hub = new CollisionEventsHub();
    hub.attach(physics);

    const enter: Array<any> = [];
    const exit: Array<any> = [];

    hub.onEntityEnter("A", (ev) => enter.push(ev));
    hub.onEntityExit("A", (ev) => exit.push(ev));

    sink?.({ kind: "stay", a: "A", b: "B" });
    sink?.({ kind: "enter", a: "A", b: "B" });
    sink?.({ kind: "exit", a: "A", b: "B" });

    expect(enter.length).toBe(1);
    expect(enter[0].kind).toBe("enter");

    expect(exit.length).toBe(1);
    expect(exit[0].kind).toBe("exit");

    hub.dispose();
  });

  it("dispatches collider-scoped callbacks and includes body-owner ids", () => {
    let sink: ((ev: PhysicsCollisionEvent) => void) | undefined;

    const physics: IPhysicsSystem = {
      addEntity: () => {},
      removeEntity: () => {},
      update: () => {},
      dispose: () => {},
      subscribeCollisions: (listener) => {
        sink = listener;
        return () => {
          sink = undefined;
        };
      }
    };

    const hub = new CollisionEventsHub();
    hub.attach(physics);

    const received: Array<any> = [];
    hub.onCollider("C1", (ev) => received.push(ev));

    sink?.({ kind: "enter", a: "BodyA", b: "BodyB", colliderA: "C1", colliderB: "C2" });

    expect(received.length).toBe(1);
    expect(received[0].self).toBe("C1");
    expect(received[0].other).toBe("C2");
    expect(received[0].selfBody).toBe("BodyA");
    expect(received[0].otherBody).toBe("BodyB");

    hub.dispose();
  });
});
