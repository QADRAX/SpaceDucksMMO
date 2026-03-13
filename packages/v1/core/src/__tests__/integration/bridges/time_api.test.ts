/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

describe("Bridge E2E – Time API", () => {
    it("test_time_api: getDelta, getElapsed, getFrameCount, getScale, setScale", async () => {
        const src = SceneTestScaffold.loadTestScript("test_time_api.lua");
        const scaffold = new SceneTestScaffold({
            "test://timeapi": src
        });

        scaffold.spawnScriptedEntity("tapi", "test://timeapi");
        await scaffold.wait();

        // Init checks
        let logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] INIT DONE")).toBe(true);

        // Frame 1
        scaffold.tick(16);
        logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] FRAME1 DONE")).toBe(true);

        // Frame 2
        scaffold.tick(16);
        logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] FRAME2 DONE")).toBe(true);
        expect(logsContain(logs, "[TimeAPI] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});
