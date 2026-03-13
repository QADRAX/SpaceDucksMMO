/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

describe("Bridge E2E – Entity Destroy", () => {
    it("test_scene_destroy: self:destroy() removes entity from scene", async () => {
        const src = SceneTestScaffold.loadTestScript("test_scene_destroy.lua");
        const scaffold = new SceneTestScaffold({
            "test://destroy": src
        });

        scaffold.spawnScriptedEntity("doomed", "test://destroy");
        await scaffold.wait();

        // Entity should exist after init
        expect(scaffold.scene.getEntity("doomed")).toBeDefined();

        const logs0 = scaffold.getLogs();
        expect(logsContain(logs0, "[Destroy] init called for doomed")).toBe(true);

        // Frame 1: no destroy yet
        scaffold.tick(16);
        expect(scaffold.scene.getEntity("doomed")).toBeDefined();

        // Frame 2: destroy fires
        scaffold.tick(16);

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Destroy] calling self:destroy()")).toBe(true);
        expect(logsContain(logs, "[Destroy] onDestroy called for doomed")).toBe(true);

        // Entity should be removed from scene
        expect(scaffold.scene.getEntity("doomed")).toBeUndefined();
    });
});
