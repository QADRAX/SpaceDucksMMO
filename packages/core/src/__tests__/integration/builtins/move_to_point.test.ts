/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

describe("builtin://move_to_point.lua", () => {
    it("eased movement to target coordinate", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("mover", "builtin://move_to_point.lua", {
            targetPoint: [10, 5, 0],
            duration: 0.5,
            easing: "cubicInOut",
            delay: 0
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "mover")!;

        for (let i = 0; i < 20; i++) scaffold.tick(50);
        const p1 = getEntityPosition(scaffold, "mover")!;

        // Should have moved towards (10, 5, 0)
        expect(p1.x).toBeGreaterThan(p0.x + 0.1);
    });
});
