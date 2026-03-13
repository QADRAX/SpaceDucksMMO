/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

describe("Bridge E2E – Vec3 Core", () => {
    it("test_bridge_vec3: full Vec3 marshalling and operators", async () => {
        const src = SceneTestScaffold.loadTestScript("test_bridge_vec3.lua");
        const scaffold = new SceneTestScaffold({
            "test://vec3core": src
        });

        // Spawn target entity at (5, 3, 1) for cross-entity tests
        const target = new Entity("tgt");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(5, 3, 1);

        scaffold.spawnScriptedEntity("v3test", "test://vec3core", {
            targetEntityId: "tgt",
            offset: [1, 2, 3]
        });

        await scaffold.wait();
        const logs = scaffold.getLogs();

        expect(logsContain(logs, "[Vec3Test] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});
