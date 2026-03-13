/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function getEntityRotation(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const r = ent.transform.localRotation;
    return { x: r.x, y: r.y, z: r.z };
}

describe("builtin://rotate_continuous.lua", () => {
    it("rotates entity over time", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("spinner", "builtin://rotate_continuous.lua", {
            speedX: 0, speedY: 90, speedZ: 0
        });

        await scaffold.wait();
        const r0 = getEntityRotation(scaffold, "spinner")!;

        scaffold.tick(1000); // 1 second at 90°/s
        const r1 = getEntityRotation(scaffold, "spinner")!;

        // Y rotation should have increased (~90° = ~1.5708 rad)
        expect(Math.abs(r1.y - r0.y)).toBeGreaterThan(0.1);
    });
});
