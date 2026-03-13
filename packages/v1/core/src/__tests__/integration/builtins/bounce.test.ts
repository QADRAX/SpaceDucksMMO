/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

describe("builtin://bounce.lua", () => {
    it("oscillates entity position on the configured axis", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("bouncer", "builtin://bounce.lua", {
            axis: "y", amplitude: 2, frequency: 1
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "bouncer")!;

        // Tick several frames so time.getElapsed() accumulates
        for (let i = 0; i < 10; i++) scaffold.tick(25);
        const p1 = getEntityPosition(scaffold, "bouncer")!;

        // X and Z should remain unchanged
        expect(p1.x).toBeCloseTo(p0.x, 3);
        expect(p1.z).toBeCloseTo(p0.z, 3);

        // Y should have changed due to sine oscillation (Lua-side state
        // now preserves the Vec3 metatable for origin:clone())
        expect(Math.abs(p1.y - p0.y)).toBeGreaterThan(0.001);
    });
});
