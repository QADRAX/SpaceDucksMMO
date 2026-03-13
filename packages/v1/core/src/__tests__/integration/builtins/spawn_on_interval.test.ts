/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

describe("builtin://spawn_on_interval.lua", () => {
    it("accumulates timer without crash (no valid prefab)", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("spawner", "builtin://spawn_on_interval.lua", {
            prefab: "", // No real prefab in test env
            interval: 0.1,
            maxCount: 5,
            offset: [0, 1, 0]
        });

        await scaffold.wait();

        scaffold.tick(16);
        scaffold.tick(16);
        scaffold.tick(16);

        // Should not crash even without a valid prefab
        expect(scaffold.scene.getEntity("spawner")).toBeDefined();
    });
});
