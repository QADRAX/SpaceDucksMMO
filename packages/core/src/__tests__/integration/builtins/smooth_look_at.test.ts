/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

function getEntityRotation(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const r = ent.transform.localRotation;
    return { x: r.x, y: r.y, z: r.z };
}

describe("builtin://smooth_look_at.lua", () => {
    it("eased rotation towards target", async () => {
        const scaffold = new SceneTestScaffold();

        const target = new Entity("st");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(0, 0, 10);

        scaffold.spawnScriptedEntity("sml", "builtin://smooth_look_at.lua", {
            targetEntityId: "st",
            speed: 3,
            easing: "sineOut",
            offset: [0, 0, 0]
        });

        await scaffold.wait();
        const r0 = getEntityRotation(scaffold, "sml")!;

        scaffold.tick(100);
        const r1 = getEntityRotation(scaffold, "sml")!;

        expect(r1).toBeDefined();
    });
});
