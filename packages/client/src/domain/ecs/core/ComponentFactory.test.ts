import { Entity } from "@client/domain/ecs/core/Entity";
import { DefaultEcsComponentFactory } from "./ComponentFactory";
import { BoxGeometryComponent } from "@client/domain/ecs/components/geometry/BoxGeometryComponent";
import { ShaderMaterialComponent } from "@client/domain/ecs/components/material/ShaderMaterialComponent";

describe("DefaultEcsComponentFactory", () => {
  const factory = new DefaultEcsComponentFactory();

  test("create returns component instance with correct type", () => {
    const comp = factory.create("orbit");
    expect((comp as any).type).toBe("orbit");
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

    // add shaderMaterial -- material should now be excluded due to conflict
    e.addComponent(new ShaderMaterialComponent({ shaderType: "atmosphere", uniforms: {} }));
    const afterShader = factory.listCreatableComponents(e).map((d) => d.type);
    expect(afterShader).not.toContain("standardMaterial");
    expect(afterShader).not.toContain("basicMaterial");
  });
});
