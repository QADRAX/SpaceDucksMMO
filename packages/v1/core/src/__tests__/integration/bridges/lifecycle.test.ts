/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

describe("Bridge E2E – Lifecycle", () => {
    it("test_lifecycle: init and update hooks execute correctly", async () => {
        const src = SceneTestScaffold.loadTestScript("test_lifecycle.lua");
        const scaffold = new SceneTestScaffold({
            "test://lifecycle": src
        });

        scaffold.spawnScriptedEntity("lc", "test://lifecycle");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Test] init called, state type: table")).toBe(true);

        scaffold.tick(16);
        expect(logsContain(scaffold.getLogs(), "[Test] first update")).toBe(true);
    });
});
