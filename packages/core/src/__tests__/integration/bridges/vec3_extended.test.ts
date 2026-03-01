/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

describe("Bridge E2E – Vec3 Extended", () => {
    it("test_vec3_extended: lerp, reflect, project, angleTo, min, max, abs, floor, ceil, set, toArray, lengthSq", async () => {
        const src = SceneTestScaffold.loadTestScript("test_vec3_extended.lua");
        const scaffold = new SceneTestScaffold({
            "test://vec3ext": src
        });

        scaffold.spawnScriptedEntity("v3ext", "test://vec3ext");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Vec3Ext] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});
