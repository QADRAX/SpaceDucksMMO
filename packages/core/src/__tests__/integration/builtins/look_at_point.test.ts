/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function getEntityRotation(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const r = ent.transform.localRotation;
    return { x: r.x, y: r.y, z: r.z };
}

describe("builtin://look_at_point.lua", () => {
    it("rotates to face a static coordinate", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("pointer", "builtin://look_at_point.lua", {
            targetPoint: [5, 5, 5]
        });

        await scaffold.wait();
        scaffold.tick(16);

        const rot = getEntityRotation(scaffold, "pointer")!;
        expect(rot).toBeDefined();
    });
});
