/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

describe("builtin://first_person_move.lua", () => {
    it("no crash with zero input", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("fpsc", "builtin://first_person_move.lua", {
            moveSpeed: 5,
            sprintMultiplier: 2,
            flyMode: false
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "fpsc")!;

        scaffold.tick(16);
        scaffold.tick(16);
        const p1 = getEntityPosition(scaffold, "fpsc")!;

        // No input → no movement
        expect(p1.x).toBeCloseTo(p0.x, 3);
        expect(p1.y).toBeCloseTo(p0.y, 3);
        expect(p1.z).toBeCloseTo(p0.z, 3);
    });
});
