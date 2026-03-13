/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

describe("builtin://follow_entity_physics.lua", () => {
    it("physics-based follow (noop physics, no crash)", async () => {
        const scaffold = new SceneTestScaffold();

        const leader = new Entity("lead-p");
        scaffold.scene.addEntity(leader);
        leader.transform.setPosition(5, 0, 0);

        scaffold.spawnScriptedEntity("fphys", "builtin://follow_entity_physics.lua", {
            targetEntityId: "lead-p",
            strength: 10,
            damping: 0.9,
            offset: [0, 2, 2]
        });

        await scaffold.wait();
        scaffold.tick(16);
        scaffold.tick(16);

        // Should not crash even with noop physics
        expect(scaffold.scene.getEntity("fphys")).toBeDefined();
    });
});
