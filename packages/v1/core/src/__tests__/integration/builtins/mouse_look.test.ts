/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

describe("builtin://mouse_look.lua", () => {
    it("no crash with zero mouse delta", async () => {
        const scaffold = new SceneTestScaffold();
        scaffold.spawnScriptedEntity("ml", "builtin://mouse_look.lua", {
            sensitivityX: 0.002,
            sensitivityY: 0.002,
            invertY: false
        });

        await scaffold.wait();
        scaffold.tick(16);
        scaffold.tick(16);

        // No mouse movement → no rotation change, no crash
        expect(scaffold.scene.getEntity("ml")).toBeDefined();
    });
});
