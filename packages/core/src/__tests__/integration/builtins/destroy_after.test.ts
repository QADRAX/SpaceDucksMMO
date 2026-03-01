/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

describe("builtin://destroy_after.lua", () => {
    it("removes entity after lifetime expires", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("mortal", "builtin://destroy_after.lua", {
            lifetime: 0.05 // 50ms  — dt is passed in ms, accumulation is raw
        });

        await scaffold.wait();
        expect(scaffold.scene.getEntity("mortal")).toBeDefined();

        // dt=16ms → timer reaches 16 on first tick, which exceeds 0.05
        scaffold.tick(16);

        expect(scaffold.scene.getEntity("mortal")).toBeUndefined();
    });
});
