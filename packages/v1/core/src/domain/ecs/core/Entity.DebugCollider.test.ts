import Entity from "./Entity";

describe("Entity collider debug flag", () => {
  it("defaults to disabled", () => {
    const e = new Entity("E");
    expect(e.isDebugColliderEnabled()).toBe(false);
  });

  it("notifies listeners on change and supports removal", () => {
    const e = new Entity("E");
    const calls: boolean[] = [];

    const listener = (enabled: boolean) => calls.push(enabled);
    e.addDebugColliderListener(listener);

    e.setDebugColliderEnabled(true);
    e.setDebugColliderEnabled(true); // no-op
    e.setDebugColliderEnabled(false);

    expect(calls).toEqual([true, false]);

    e.removeDebugColliderListener(listener);
    e.setDebugColliderEnabled(true);
    expect(calls).toEqual([true, false]);
  });

  it("swallows listener exceptions", () => {
    const e = new Entity("E");
    e.addDebugColliderListener(() => {
      throw new Error("boom");
    });

    expect(() => e.setDebugColliderEnabled(true)).not.toThrow();
  });
});
