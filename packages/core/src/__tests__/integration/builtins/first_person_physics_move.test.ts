/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

describe("builtin://first_person_physics_move.lua", () => {
    it("no crash with zero input (noop physics)", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("fppm", "builtin://first_person_physics_move.lua", {
            moveSpeed: 6,
            sprintMultiplier: 1.75,
            maxAcceleration: 30,
            brakeDeceleration: 40,
            flyMode: false
        });

        await scaffold.wait();
        scaffold.tick(16);
        scaffold.tick(16);

        expect(scaffold.scene.getEntity("fppm")).toBeDefined();
    });
});
