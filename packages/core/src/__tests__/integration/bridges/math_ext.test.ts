/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

describe("Bridge E2E – Math Ext", () => {
    it("test_math_ext: lerp, clamp, inverseLerp, remap, sign, moveTowards, pingPong, wrapRepeat, easing", async () => {
        const src = SceneTestScaffold.loadTestScript("test_math_ext.lua");
        const scaffold = new SceneTestScaffold({
            "test://mathext": src
        });

        scaffold.spawnScriptedEntity("mext", "test://mathext");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[MathExt] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});
