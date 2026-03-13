/** @jest-environment node */
jest.unmock('wasmoon');
import { SceneTestScaffold } from "../utils/SceneTestScaffold";

describe("Custom Test Scripts Integration", () => {
    it("test_lifecycle.lua: verifies lifecycle hooks via injection", async () => {
        const scriptSource = SceneTestScaffold.loadTestScript("test_lifecycle.lua");
        const scaffold = new SceneTestScaffold({
            "test://lifecycle": scriptSource
        });

        scaffold.spawnScriptedEntity("test-ent", "test://lifecycle");

        // Wait for wasmoon async init/compile/init()
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logs).toContain("[INFO] [Lua] [Test] init called, state type: table");

        // First update
        scaffold.tick(16);
        expect(scaffold.getLogs()).toContain("[INFO] [Lua] [Test] first update");
    });
});
