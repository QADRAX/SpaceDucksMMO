import { Entity } from "./Entity";
import { DefaultEcsComponentFactory } from "./ComponentFactory";
import { BoxGeometryComponent } from "../components/geometry/BoxGeometryComponent";
import { BasicShaderMaterialComponent } from "../components/material/shaders/BasicShaderMaterialComponent";
import { SphereColliderComponent } from "../components/physics/SphereColliderComponent";
import { RigidBodyComponent } from "../components/physics/RigidBodyComponent";

describe("DefaultEcsComponentFactory", () => {
  const factory = new DefaultEcsComponentFactory();

  test("create returns component instance with correct type", () => {
    const comp = factory.create("orbit");
    expect((comp as any).type).toBe("orbit");

    const scriptComp = factory.create("script");
    expect((scriptComp as any).type).toBe("script");
  });

  test("listCreatableComponents respects 'unique' and 'requires' and 'conflicts'", () => {
    const e = new Entity("e1");
    // initially, geometry types should be creatable, material should NOT (requires geometry)
    const initial = factory.listCreatableComponents(e).map((d) => d.type);
    expect(initial).toContain("boxGeometry");
    expect(initial).not.toContain("standardMaterial");
    expect(initial).not.toContain("basicMaterial");

    // add geometry and verify material becomes creatable
    e.addComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 }) as any);
    const afterGeom = factory.listCreatableComponents(e).map((d) => d.type);
    expect(afterGeom).toContain("standardMaterial");
    expect(
      factory.create("basicShaderMaterial")
    ).toBeInstanceOf(BasicShaderMaterialComponent);
    // add shaderMaterial -- material should now be excluded due to conflict
    e.addComponent(new BasicShaderMaterialComponent({ shaderId: "test-shader", uniforms: {} }));
    const afterShader = factory.listCreatableComponents(e).map((d) => d.type);
    expect(afterShader).not.toContain("standardMaterial");
    expect(afterShader).not.toContain("basicMaterial");
  });

  test("listCreatableComponents includes physics components", () => {
    const e = new Entity("e-physics");
    const initial = factory.listCreatableComponents(e).map((d) => d.type);
    expect(initial).toContain("rigidBody");
    expect(initial).toContain("gravity");
    // Colliders require a rigidBody owner (self or ancestor)
    expect(initial).not.toContain("sphereCollider");
    expect(initial).not.toContain("boxCollider");

    expect(initial).toContain("script");
  });

  test("listCreatableComponents offers colliders when entity has rigidBody", () => {
    const e = new Entity("e-physics-rb");
    e.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);
    const list = factory.listCreatableComponents(e).map((d) => d.type);
    expect(list).toContain("sphereCollider");
    expect(list).toContain("boxCollider");
  });

  test("listCreatableComponents offers colliders when rigidBody exists on an ancestor", () => {
    const parent = new Entity("p");
    parent.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);

    const child = new Entity("c");
    parent.addChild(child);

    const list = factory.listCreatableComponents(child).map((d) => d.type);
    expect(list).toContain("sphereCollider");
    expect(list).toContain("capsuleCollider");
  });

  test("listCreatableComponents omits additional colliders when one is present on the same entity", () => {
    const e = new Entity("e-collider");
    e.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }) as any);
    e.addComponent(new SphereColliderComponent({ radius: 1 }) as any);
    const after = factory.listCreatableComponents(e).map((d) => d.type);
    expect(after).not.toContain("sphereCollider");
    expect(after).not.toContain("boxCollider");
    expect(after).not.toContain("capsuleCollider");
    expect(after).not.toContain("cylinderCollider");
    expect(after).not.toContain("coneCollider");
    expect(after).not.toContain("terrainCollider");
  });
});
