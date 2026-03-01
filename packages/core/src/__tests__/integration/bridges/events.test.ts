/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

describe("Bridge E2E – Scene Events", () => {
    it("test_events: fireEvent and onEvent round-trip", async () => {
        const src = SceneTestScaffold.loadTestScript("test_events.lua");
        const scaffold = new SceneTestScaffold({
            "test://events": src
        });

        scaffold.spawnScriptedEntity("evt", "test://events");
        await scaffold.wait();

        // Fire + receive on first tick
        scaffold.tick(16);
        // The handler runs synchronously during fireEvent, which is in the same update
        scaffold.tick(16);

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Events] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});
