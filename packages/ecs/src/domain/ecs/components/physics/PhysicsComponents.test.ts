import { Entity } from "../../core/Entity";
import type IComponentObserver from "../../core/IComponentObserver";
import BoxColliderComponent from "./BoxColliderComponent";
import CapsuleColliderComponent from "./CapsuleColliderComponent";
import ConeColliderComponent from "./ConeColliderComponent";
import CylinderColliderComponent from "./CylinderColliderComponent";
import GravityComponent from "./GravityComponent";
import RigidBodyComponent from "./RigidBodyComponent";
import SphereColliderComponent from "./SphereColliderComponent";
import TerrainColliderComponent from "./TerrainColliderComponent";

describe("ECS physics components", () => {
  it("Collider validate reports invalid params per collider type", () => {
    expect(new SphereColliderComponent({ radius: -1 }).validate()).toContain("Sphere radius must be > 0");

    expect(new BoxColliderComponent({ halfExtents: { x: 0, y: 0, z: 0 } }).validate()).toContain(
      "Box halfExtents cannot all be 0"
    );

    expect(new CapsuleColliderComponent({ radius: 0.1, halfHeight: -1 }).validate()).toContain(
      "Capsule halfHeight must be >= 0"
    );

    expect(new CylinderColliderComponent({ radius: 0.1, halfHeight: -1 }).validate()).toContain(
      "Cylinder halfHeight must be >= 0"
    );

    expect(new ConeColliderComponent({ radius: -1 }).validate()).toContain("Cone radius must be > 0");

    expect(
      new TerrainColliderComponent({
        heightfield: {
          columns: 2,
          rows: 2,
          heights: [0, 0, 0],
          size: { x: 10, z: 10 },
        },
      }).validate()
    ).toContain("Terrain heights length must be columns*rows (4)");
  });

  it("Entity.safeAddComponent rejects invalid physics components via validate()", () => {
    const e = new Entity("E");
    const res = e.safeAddComponent(new SphereColliderComponent({ radius: -1 }) as any);
    expect(res.ok).toBe(false);
  });

  it("SphereColliderComponent inspector can change radius and notifies observers", () => {
    const e = new Entity("E");
    const c = new SphereColliderComponent({ radius: 1 });
    e.addComponent(c as any);

    const observer: IComponentObserver = {
      onComponentChanged: jest.fn(),
    };
    c.addObserver(observer);

    const radiusField = c.metadata.inspector?.fields.find((f: any) => f.key === "radius");
    if (!radiusField || typeof (radiusField as any).set !== "function") {
      throw new Error("Expected inspector field 'radius' with a set() function");
    }

    (radiusField as any).set(c, 2);
    expect(c.radius).toBe(2);

    expect((observer.onComponentChanged as any).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("GravityComponent stores gravity and inspector updates values", () => {
    const g = new GravityComponent();
    expect(g.gravity).toEqual([0, -9.81, 0]);

    const field = g.metadata.inspector?.fields[0] as any;
    field.set(g, [1, 2, 3]);
    expect(g.gravity).toEqual([1, 2, 3]);
  });

  it("RigidBodyComponent.validate catches negative values", () => {
    const rb = new RigidBodyComponent({ mass: -1, linearDamping: -0.1, angularDamping: -0.2 } as any);
    const errs = rb.validate();
    expect(errs).toContain("Mass must be >= 0");
    expect(errs).toContain("Linear damping must be >= 0");
    expect(errs).toContain("Angular damping must be >= 0");
  });
});
