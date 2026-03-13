import { Entity } from "./Entity";
import { Component } from "./Component";
import { ComponentMetadata } from "./ComponentMetadata";
import type { ComponentType } from "./ComponentType";

class ReqComp extends Component {
  readonly type = "req" as ComponentType;
  readonly metadata = { requires: ["dep"] } as any;
}

class DepComp extends Component {
  readonly type = "dep" as ComponentType;
  readonly metadata = {} as any;
}

class BaseTestComponent extends Component {
  constructor(
    public readonly type: ComponentType,
    public readonly metadata: ComponentMetadata
  ) {
    super();
  }
  triggerChange() {
    this.notifyChanged();
  }
}

describe("Entity Result-based component APIs", () => {
  it("safeAddComponent returns error when requirements missing", () => {
    const e = new Entity("e1");
    const res = e.safeAddComponent(new ReqComp());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("invalid-component");
  });

  it("safeAddComponent succeeds when requirements present", () => {
    const e = new Entity("e2");
    const r = e.safeAddComponent(new DepComp());
    expect(r.ok).toBe(true);
    const s = e.safeAddComponent(new ReqComp());
    expect(s.ok).toBe(true);
  });

  it("safeRemoveComponent returns error when other components require it", () => {
    const e = new Entity("e3");
    e.safeAddComponent(new DepComp());
    e.safeAddComponent(new ReqComp());
    const res = e.safeRemoveComponent("dep" as ComponentType);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("invalid-component");
  });
});

describe("Entity component validation", () => {
  test("unique component cannot be added twice", () => {
    const e = new Entity("E1");
    const UniqueA = new BaseTestComponent("UniqueA" as ComponentType, {
      type: "UniqueA",
      unique: true,
    });
    e.addComponent(UniqueA);
    expect(() =>
      e.addComponent(
        new BaseTestComponent("UniqueA" as ComponentType, { type: "UniqueA", unique: true })
      )
    ).toThrow(/already exists/);
  });

  test("requires prevents addition without dependency", () => {
    const e = new Entity("E1");
    const RequiresB = new BaseTestComponent("RequiresB" as ComponentType, {
      type: "RequiresB",
      requires: ["DepB"],
    });
    expect(() => e.addComponent(RequiresB)).toThrow(/requires 'DepB'/);
    e.addComponent(new BaseTestComponent("DepB" as ComponentType, { type: "DepB" }));
    expect(() => e.addComponent(RequiresB)).not.toThrow();
  });

  test("conflicts prevents addition when conflicting component exists", () => {
    const e = new Entity("E1");
    e.addComponent(new BaseTestComponent("A" as ComponentType, { type: "A" }));
    const ConflictsA = new BaseTestComponent("ConflictsA" as ComponentType, {
      type: "ConflictsA",
      conflicts: ["A"],
    });
    expect(() => e.addComponent(ConflictsA)).toThrow(
      /conflicts with existing 'A'/
    );
  });

  test("cannot remove component required by another", () => {
    const e = new Entity("E1");
    const DepB = new BaseTestComponent("DepB" as ComponentType, { type: "DepB" });
    const RequiresB = new BaseTestComponent("RequiresB" as ComponentType, {
      type: "RequiresB",
      requires: ["DepB"],
    });
    e.addComponent(DepB).addComponent(RequiresB);
    expect(() => e.removeComponent("DepB" as ComponentType)).toThrow(/requires 'DepB'/);
  });

  test("removal succeeds when no dependency", () => {
    const e = new Entity("E1");
    e.addComponent(new BaseTestComponent("X" as ComponentType, { type: "X" }));
    expect(() => e.removeComponent("X" as ComponentType)).not.toThrow();
    expect(e.hasComponent("X" as ComponentType)).toBe(false);
  });

  test("Entity.update skips disabled components", () => {
    const e = new Entity("E2");
    let called = 0;
    class UpComp extends Component {
      readonly type = "up" as ComponentType;
      readonly metadata = { type: "up" } as any;
      update(dt: number) {
        called += 1;
      }
    }
    const c = new UpComp();
    e.addComponent(c as any);
    e.update(0.016);
    expect(called).toBe(1);
    c.enabled = false;
    e.update(0.016);
    expect(called).toBe(1);
  });
});
