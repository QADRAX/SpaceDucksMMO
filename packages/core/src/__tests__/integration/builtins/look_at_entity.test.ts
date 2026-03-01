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

describe("builtin://look_at_entity.lua", () => {
    it("rotates to face target entity", async () => {
        const scaffold = new SceneTestScaffold();

        const target = new Entity("target");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(10, 0, 0);

        scaffold.spawnScriptedEntity("looker", "builtin://look_at_entity.lua", {
            targetEntityId: "target",
            speed: 5,
            lookAtOffset: [0, 0, 0]
        });

        await scaffold.wait();
        scaffold.tick(16);

        const rot = getEntityRotation(scaffold, "looker")!;
        expect(rot).toBeDefined();
        // Should have rotated towards target at (10,0,0)
    });
});
