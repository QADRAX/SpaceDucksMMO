/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

describe("builtin://smooth_follow.lua", () => {
    it("eased follow moves entity towards target + offset", async () => {
        const scaffold = new SceneTestScaffold();

        const target = new Entity("sft");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(10, 0, 10);

        scaffold.spawnScriptedEntity("smf", "builtin://smooth_follow.lua", {
            targetEntityId: "sft",
            duration: 0.5,
            easing: "quadOut",
            offset: [0, 3, 3]
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "smf")!;

        for (let i = 0; i < 20; i++) scaffold.tick(50);
        const p1 = getEntityPosition(scaffold, "smf")!;

        // Should have moved towards (10+0, 0+3, 10+3) = (10, 3, 13)
        const dist = Math.sqrt(
            (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2 + (p1.z - p0.z) ** 2
        );
        expect(dist).toBeGreaterThan(0.1);
    });
});
